/**
 * AI client wrappers for LLM completions.
 *
 * Routes between providers via LlmConfig.provider:
 *   - "b3iq" (default): the B3IQ network (OpenAI-compatible gateway)
 *   - "openrouter":     OpenRouter (dormant fallback; needs OPENROUTER_API_KEY)
 *   - "auto":           B3IQ first, OpenRouter on failure
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
}

export interface LlmConfig {
  /** B3IQ gateway key (gateway:chat scope). Primary provider. */
  b3iqApiKey?: string;
  /** OpenRouter key — only needed when provider is "openrouter" or "auto". */
  openRouterApiKey?: string;
  /** "b3iq" | "openrouter" | "auto" — defaults to "b3iq". */
  provider?: string;
}

/**
 * Provider-agnostic completion. Picks B3IQ or OpenRouter based on
 * config.provider; "auto" tries B3IQ first and falls through on error.
 *
 * Per-call `model` is OpenRouter's namespaced id (e.g. "google/gemini-2.5-flash")
 * for the OpenRouter path. On the B3IQ path it is ignored unless a B3IQ-native
 * model name (qwen.../gemma...) was passed, in which case it is forwarded as-is.
 */
export async function aiCompletion(
  config: LlmConfig,
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const provider = (config.provider || "b3iq").toLowerCase();
  const hasB3iq = !!config.b3iqApiKey;
  const hasOpenRouter = !!config.openRouterApiKey;
  const b3iqModel = options.model && /^(qwen|gemma)/i.test(options.model) ? options.model : undefined;

  if ((provider === "b3iq" || provider === "auto") && hasB3iq) {
    try {
      return await b3iqCompletion(config.b3iqApiKey!, messages, { ...options, model: b3iqModel });
    } catch (err) {
      // Only "auto" falls through to OpenRouter; "b3iq" surfaces the error.
      if (provider !== "auto" || !hasOpenRouter) throw err;
      console.warn(
        `[ai.aiCompletion] B3IQ failed, falling back to OpenRouter: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (!hasOpenRouter) {
    throw new Error("No LLM provider configured: set B3IQ_API_KEY (provider=b3iq) or OPENROUTER_API_KEY.");
  }
  return openRouterCompletion(config.openRouterApiKey!, messages, options);
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
// B3IQ network (OpenAI-compatible gateway — Qwen + Gemma across enrolled nodes)
// ---------------------------------------------------------------------------

const B3IQ_ENDPOINT = "https://b3iq.org/v1/api/chat/completions";
// Multi-node "Andromeda" Qwen3.6 35B route: the most reliable + capable chat
// model on the network. See https://b3iq.org/v1/api/models for the live list;
// any served model id works.
const DEFAULT_B3IQ_MODEL = "qwen3.6-35b-a3b";

// Strip a <think>…</think> reasoning preamble (reasoning models emit one) so
// callers that parse the content as JSON aren't tripped up. No-op on clean output.
function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trimStart();
}

/**
 * Call the B3IQ network's OpenAI-compatible chat completions API. Defaults to the
 * multi-node Qwen3.6 35B route — best for product UX (fast, reliable). Auth is a
 * B3IQ gateway key (gateway:chat scope, https://b3iq.org → API keys).
 */
export async function b3iqCompletion(
  apiKey: string,
  messages: CompletionMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_B3IQ_MODEL,
    maxTokens = 2048,
    temperature = 0.2,
    timeoutMs = 45_000,
  } = options;

  const response = await fetch(B3IQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      // Ask Qwen to skip its <think> reasoning preamble — our extractors only
      // consume final JSON. Honored by the llama.cpp nodes; stripReasoning()
      // below is the belt-and-suspenders fallback for any model that ignores it.
      chat_template_kwargs: { enable_thinking: false },
      messages,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `B3IQ API error (${response.status}): ${errorText.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string }; text?: string }>;
  };

  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
  if (!content) {
    throw new Error("B3IQ returned an empty response");
  }
  return stripReasoning(content);
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
