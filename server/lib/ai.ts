/**
 * AI client wrappers for LLM completions.
 *
 * Routes between providers via LlmConfig.provider:
 *   - "openrouter" (default): OpenRouter (cheap, many models)
 *   - "andromeda":            Sean's hosted Andromeda LLM gateway
 *   - "auto":                 Andromeda first, OpenRouter on failure
 *
 * Cloudflare Workers AI REST API kept as a separate utility (not routed).
 */

interface CompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Request timeout in ms. Default 45s. CF Workflow step timeouts have
   * proven not to enforce in practice — this is the user-space fallback. */
  timeoutMs?: number;
  /** Andromeda routing hint when provider=andromeda. Ignored otherwise. */
  andromedaRoute?: "speed" | "quality" | "long-context";
}

export interface LlmConfig {
  openRouterApiKey: string;
  andromedaApiKey?: string;
  /** "openrouter" | "andromeda" | "auto" — defaults to "openrouter". */
  provider?: string;
}

/**
 * Provider-agnostic completion. Picks Andromeda or OpenRouter based on
 * config.provider; "auto" tries Andromeda first and falls through on error.
 *
 * Per-call `model` is OpenRouter's namespaced ID (e.g. "google/gemini-2.5-flash").
 * When routed to Andromeda, the OpenRouter model is ignored and we use Andromeda's
 * default Qwen unless an explicit Andromeda model name was passed in via options.
 */
export async function aiCompletion(
  config: LlmConfig,
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const provider = (config.provider || "openrouter").toLowerCase();
  const hasAndromeda = !!config.andromedaApiKey;
  const isAndromedaModel = options.model && /^(qwen|gemma|auto)/.test(options.model);

  if (provider === "andromeda" && hasAndromeda) {
    return andromedaCompletion(config.andromedaApiKey!, messages, {
      ...options,
      model: isAndromedaModel ? options.model : undefined,
    });
  }

  if (provider === "auto" && hasAndromeda) {
    try {
      return await andromedaCompletion(config.andromedaApiKey!, messages, {
        ...options,
        model: isAndromedaModel ? options.model : undefined,
      });
    } catch (err) {
      // Fall through to OpenRouter
      console.warn(
        `[ai.aiCompletion] Andromeda failed, falling back to OpenRouter: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return openRouterCompletion(config.openRouterApiKey, messages, options);
}

// ---------------------------------------------------------------------------
// OpenRouter
// ---------------------------------------------------------------------------

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";

/**
 * Call the OpenRouter chat completions API and return the text content of the
 * first choice.
 */
export async function openRouterCompletion(
  apiKey: string,
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_OPENROUTER_MODEL,
    maxTokens = 4096,
    temperature = 0.3,
    timeoutMs = 45_000,
  } = options;

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://extractvibe.com",
      "X-Title": "ExtractVibe",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content;
}

// ---------------------------------------------------------------------------
// Andromeda LLM (Sean's hosted gateway — Qwen + Gemma)
// ---------------------------------------------------------------------------

const ANDROMEDA_ENDPOINT = "https://andromeda-llm.lemoolah.com/v1/chat/completions";
const DEFAULT_ANDROMEDA_MODEL = "qwen3.6-35b-a3b";

/**
 * Call the Andromeda LLM gateway. OpenAI-compatible chat completions API.
 * Defaults to Qwen on the speed route — best for product UX where we want
 * sub-second-ish first-token latency on small JSON outputs.
 */
export async function andromedaCompletion(
  apiKey: string,
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_ANDROMEDA_MODEL,
    maxTokens = 2048,
    temperature = 0.2,
    timeoutMs = 45_000,
    andromedaRoute = "speed",
  } = options;

  const callAndromeda = async (
    selectedModel: string,
    selectedRoute: "speed" | "quality" | "long-context",
    selectedMaxTokens: number,
  ): Promise<Response> => {
    return fetch(ANDROMEDA_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        andromeda_route: selectedRoute,
        max_tokens: selectedMaxTokens,
        temperature,
        // Disable Qwen's <think> reasoning preamble for product calls — adds
        // latency and our extractors only consume final JSON anyway.
        chat_template_kwargs: { enable_thinking: false },
        messages,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  };

  let response = await callAndromeda(model, andromedaRoute, maxTokens);

  // Qwen on the speed route has a 4096-token context budget. When prompt
  // + requested completion exceeds it the gateway returns 413. Auto-retry
  // on Gemma's long-context route (32k ctx) so callers don't have to think
  // about it. Skill section "413 context budget exceeded" describes this.
  if (response.status === 413 && andromedaRoute === "speed") {
    response = await callAndromeda("auto", "long-context", maxTokens);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Andromeda LLM error (${response.status}): ${errorText.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
  };

  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
  if (!content) {
    throw new Error("Andromeda LLM returned an empty response");
  }
  return content;
}

// ---------------------------------------------------------------------------
// Cloudflare Workers AI (REST API fallback)
// ---------------------------------------------------------------------------

/**
 * Call the Cloudflare Workers AI REST API with a simple prompt.
 * Requires the account ID and API token to be provided (since we don't have
 * an AI binding configured).
 */
export async function cloudflareAI(
  accountId: string,
  apiToken: string,
  prompt: string,
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const {
    model = "@cf/meta/llama-3.1-8b-instruct",
    maxTokens = 2048,
  } = options;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudflare AI error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    result: { response: string };
  };

  return data.result.response;
}
