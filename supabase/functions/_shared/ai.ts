// Shared AI client. Replaces the former Lovable AI gateway
// (https://ai.gateway.lovable.dev/v1/chat/completions + LOVABLE_API_KEY).
//
// OpenRouter speaks the OpenAI chat-completions dialect, so request and
// response shapes are unchanged from the gateway — only the base URL, the
// auth header and the model ids differ.
//
// Required Supabase secret:
//   OPENROUTER_API_KEY
//
// Optional secrets (all have defaults):
//   AI_MODEL_DEFAULT   – text-only reasoning calls
//   AI_MODEL_VISION    – image / PDF calls (must be a multimodal model)
//   OPENROUTER_SITE_URL, OPENROUTER_APP_NAME – attribution shown on your
//     OpenRouter dashboard; harmless to omit.

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Model ids are OpenRouter ids (e.g. "google/gemini-3.7-flash",
 * "anthropic/claude-sonnet-4.5", "openai/gpt-4.1-mini"). Override per
 * deployment without touching code — the catalogue moves faster than this repo.
 */
export const MODEL_DEFAULT =
  Deno.env.get("AI_MODEL_DEFAULT") ?? "google/gemini-2.5-flash";
export const MODEL_VISION =
  Deno.env.get("AI_MODEL_VISION") ?? "google/gemini-2.5-flash";

export class AiConfigError extends Error {}

export function requireApiKey(): string {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) {
    throw new AiConfigError("OPENROUTER_API_KEY is not configured");
  }
  return key;
}

function attributionHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const site = Deno.env.get("OPENROUTER_SITE_URL");
  const name = Deno.env.get("OPENROUTER_APP_NAME");
  if (site) headers["HTTP-Referer"] = site;
  if (name) headers["X-Title"] = name;
  return headers;
}

export type ChatCompletionOptions = {
  model?: string;
  messages: unknown[];
  /** Ask the model for a JSON object response. */
  jsonMode?: boolean;
  stream?: boolean;
  /** Abort the request after this many milliseconds. */
  timeoutMs?: number;
  /** OpenRouter plugins array, e.g. the file-parser PDF engine. */
  plugins?: unknown[];
};

/**
 * Posts a chat completion to OpenRouter. Returns the raw `Response` so callers
 * keep their existing status-code handling (429 rate limit, 402 out of
 * credits, etc.) — OpenRouter uses the same codes the Lovable gateway did.
 */
export function chatCompletion(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = requireApiKey();

  const body: Record<string, unknown> = {
    model: opts.model ?? MODEL_DEFAULT,
    messages: opts.messages,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };
  if (opts.stream !== undefined) body.stream = opts.stream;
  if (opts.plugins) body.plugins = opts.plugins;

  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...attributionHeaders(),
    },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });
}

/**
 * PDF parsing plugin. OpenRouter routes PDFs through this engine when the
 * model has no native document support. "native" uses the model's own
 * capability where available and is cheapest.
 */
export const PDF_PLUGIN = [
  { id: "file-parser", pdf: { engine: Deno.env.get("AI_PDF_ENGINE") ?? "native" } },
];
