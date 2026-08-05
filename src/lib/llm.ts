import "server-only";

/**
 * Provider chain. See report §3.4.3.
 *
 * Ordering is driven by measured free-tier limits, not by preference. The
 * corpus is ~4,000 tokens and is resent on every call, so TOKENS-PER-MINUTE is
 * the binding constraint — not requests-per-day, which is what the marketing
 * numbers advertise. Measured from Groq's own rate-limit headers:
 *
 *   llama-3.3-70b-versatile   TPM 12,000   RPD  1,000   <- primary
 *   llama-3.1-8b-instant      TPM  6,000   RPD 14,400   <- overflow
 *
 * At ~4.3k tokens a call the 8B model allows barely one request per minute,
 * which is unusable; the 70B allows about three and is the better model. When
 * the 70B's small daily allowance runs out, the 8B's large one takes over.
 * Gemini is last because its free tier trains on the data.
 *
 * Model names rot: `gemini-2.5-flash` returned 404 "no longer available to new
 * users" within months. `gemini-flash-latest` tracks the current model, and
 * every name here is env-overridable.
 */

interface Provider {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function providers(): Provider[] {
  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;

  return [
    {
      name: "groq:70b",
      url: GROQ_URL,
      key: groq,
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    },
    {
      name: "groq:8b",
      url: GROQ_URL,
      key: groq,
      model: process.env.GROQ_MODEL_FALLBACK ?? "llama-3.1-8b-instant",
    },
    {
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: gemini,
      model: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
    },
  ].filter((p) => !!p.key);
}

/**
 * Once the 70B's daily token allowance is nearly spent, start at the 8B, which
 * has its own separate and much larger allowance (500K/day vs 100K). Dropping
 * the 70B from the chain entirely — rather than letting it 429 first — is the
 * point: a doomed request still costs the visitor a round trip.
 */
function chainFor(stage: "normal" | "tighten" | "fallback"): Provider[] {
  const chain = providers();
  if (stage !== "fallback") return chain;

  const demoted = chain.filter((p) => p.name !== "groq:70b");
  return demoted.length ? demoted : chain;
}

export function hasProvider(): boolean {
  return providers().length > 0;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Streams from the first provider that responds. Falls through on 429 (rate
 * limited) and 5xx; a non-429 4xx is a request bug and is not worth retrying
 * against a second provider.
 */
export async function streamCompletion(
  messages: LlmMessage[],
  signal: AbortSignal,
  options: { maxTokens?: number; stage?: "normal" | "tighten" | "fallback" } = {},
): Promise<ReadableStream<Uint8Array>> {
  const { maxTokens = 420, stage = "normal" } = options;
  const chain = chainFor(stage);
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
          // A ceiling, not a target — the system prompt asks for 3-5 sentences
          // and this only stops a runaway. See `answerBudget` in guardrails.ts.
          max_tokens: maxTokens,
        }),
      });

      if (response.ok && response.body) return response.body;

      lastError = `${provider.name} responded ${response.status}`;
      const detail = await response.text().catch(() => "");
      if (response.status !== 429 && response.status < 500) {
        console.error(`[llm] ${lastError}`, detail.slice(0, 300));
        // A bad model name on one provider should not stop the chain.
        if (response.status !== 404) break;
        continue;
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
