/**
 * AI client wrappers for LLM completions.
 *
 * Primary: OpenRouter (cheap, reliable, many models)
 * Fallback: Cloudflare Workers AI REST API
 */

interface CompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
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
