import {
  validate,
  fence,
  buildSystemPrompt,
  answerBudget,
  type ChatMessage,
} from "@/lib/guardrails";
import { checkRateLimit, clientId } from "@/lib/ratelimit";
import { currentBudget, applyStage, recordSpend, estimateTokens } from "@/lib/budget";
import { hasProvider, streamCompletion, toTextStream, type LlmMessage } from "@/lib/llm";

/**
 * The one API route this project allows (see CLAUDE.md → Architecture).
 * It exists solely to keep the provider key off the client.
 *
 * Order matters: rate limit first (free, protects the quota), then validation
 * (free), then the provider call (the only expensive step).
 *
 * Contributes 0 KB of client JS — it is a route handler.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Roughly 900 tokens of history. */
const HISTORY_CHAR_BUDGET = 3_600;
/** Older answers keep their opening, which is where the substance is. */
const OLD_ANSWER_CHARS = 400;
const VERBATIM_MESSAGES = 4;

/**
 * History is resent in full on every turn, so a deep conversation costs more in
 * input than the answer costs in output — twelve turns ran to roughly 6,800
 * input tokens for a single question. The newest exchanges are what a follow-up
 * actually depends on, so those stay verbatim and older answers are shortened
 * from the end, oldest dropped first.
 *
 * The newest user message is never touched.
 */
function trimHistory(history: ChatMessage[]): ChatMessage[] {
  const recent = history.slice(-VERBATIM_MESSAGES);
  const older = history.slice(0, -VERBATIM_MESSAGES);

  const condensed = older.map((m) =>
    m.role === "assistant" && m.content.length > OLD_ANSWER_CHARS
      ? { ...m, content: `${m.content.slice(0, OLD_ANSWER_CHARS).trimEnd()}…` }
      : m,
  );

  const kept: ChatMessage[] = [...recent];
  let spent = recent.reduce((n, m) => n + m.content.length, 0);
  for (let i = condensed.length - 1; i >= 0; i--) {
    const cost = condensed[i].content.length;
    if (spent + cost > HISTORY_CHAR_BUDGET) break;
    kept.unshift(condensed[i]);
    spent += cost;
  }
  return kept;
}

export async function POST(request: Request) {
  if (!hasProvider()) {
    return json(
      { error: "The assistant is unavailable right now. Please email instead." },
      503,
    );
  }

  const limit = await checkRateLimit(clientId(request));
  if (!limit.ok) {
    return json(
      {
        error:
          limit.reason === "daily"
            ? "The assistant has reached its daily limit. Please email instead."
            : "Too many questions in a row — give it a moment.",
      },
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Malformed request body." }, 400);
  }

  const result = validate(payload);
  if (!result.ok) return json({ error: result.error }, result.status);

  // Only the newest user turn is fenced: prior assistant turns are our own
  // output, and re-fencing old user turns would bloat the prompt for no gain.
  const history: ChatMessage[] = result.messages;

  // Which documents get attached is decided from the last few user turns, not
  // just the newest: "tell me more about that" has no terms of its own, and on
  // its own would retrieve nothing.
  const retrievalQuery = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" ");

  const question = history[history.length - 1].content;
  const trimmed = trimHistory(history.slice(0, -1));

  const systemPrompt = buildSystemPrompt(retrievalQuery);
  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    ...trimmed,
    { role: "user", content: fence(question) },
  ];

  // How much room this answer gets, and which model answers it. Both shrink as
  // the day's token allowance is spent — silently; a visitor is never shown the
  // site's accounting.
  const budget = await currentBudget();
  const maxTokens = applyStage(answerBudget(question), budget.stage);

  try {
    const upstream = await streamCompletion(messages, request.signal, {
      maxTokens,
      stage: budget.stage,
    });

    const promptTokens = messages.reduce((n, m) => n + estimateTokens(m.content), 0);
    let answerBytes = 0;

    // Counting as it streams costs nothing and needs no provider usage
    // reporting, which the two providers do differently.
    const counted = toTextStream(upstream).pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          answerBytes += chunk.byteLength;
          controller.enqueue(chunk);
        },
        flush() {
          recordSpend(promptTokens + Math.ceil(answerBytes / 4));
        },
      }),
    );

    return new Response(counted, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("[api/chat] all providers failed:", error);
    return json(
      { error: "The assistant could not answer just now. Please email instead." },
      502,
    );
  }
}
