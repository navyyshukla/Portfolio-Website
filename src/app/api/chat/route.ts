import {
  validate,
  fence,
  buildSystemPrompt,
  type ChatMessage,
} from "@/lib/guardrails";
import { checkRateLimit, clientId } from "@/lib/ratelimit";
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
  const messages: LlmMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history.slice(0, -1),
    { role: "user", content: fence(history[history.length - 1].content) },
  ];

  try {
    const upstream = await streamCompletion(messages, request.signal);
    return new Response(toTextStream(upstream), {
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
