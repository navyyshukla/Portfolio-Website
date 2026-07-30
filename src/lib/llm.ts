import "server-only";

/**
 * Provider chain: Groq primary, Gemini fallback. See report §3.4.3.
 *
 * Groq is primary because it is the only high-volume free tier that does not
 * retain or train on inference data by default — and visitor questions transit
 * whichever provider we pick. Gemini's free tier is explicitly marked "used to
 * improve our products", so it is the failover rather than the default.
 *
 * Both are called over the OpenAI-compatible chat-completions shape, so the
 * fallback is a base-URL and key swap rather than a second SDK. Model names are
 * env-overridable on purpose: free-tier catalogues change without notice, and a
 * hardcoded model name is how this breaks silently.
 */

interface Provider {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
}

function providers(): Provider[] {
  return [
    {
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    },
    {
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    },
  ].filter((p) => !!p.key);
}

export function hasProvider(): boolean {
  return providers().length > 0;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Returns a streaming SSE body from the first provider that responds.
 * Falls through to the next provider on 429 or 5xx; a 4xx that is not 429 is a
 * request bug and is not worth retrying against a second provider.
 */
export async function streamCompletion(
  messages: LlmMessage[],
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const chain = providers();
  let lastError = "no provider configured";

  for (const provider of chain) {
    try {
      const response = await fetch(provider.url, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (response.ok && response.body) return response.body;

      lastError = `${provider.name} responded ${response.status}`;
      if (response.status !== 429 && response.status < 500) {
        console.error(`[llm] ${lastError}`, await response.text().catch(() => ""));
        break;
      }
      console.warn(`[llm] ${lastError} — trying next provider`);
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = `${provider.name} threw`;
      console.warn(`[llm] ${lastError}:`, error);
    }
  }

  throw new Error(lastError);
}

/** Extracts text deltas from an OpenAI-compatible SSE stream. */
export function toTextStream(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return source.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(encoder.encode(delta));
            }
          } catch {
            // Partial JSON across a chunk boundary — the tail stays in `buffer`.
          }
        }
      },
    }),
  );
}
