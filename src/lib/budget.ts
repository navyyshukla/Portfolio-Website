import "server-only";

import { Redis } from "@upstash/redis";

/**
 * The day's token spend, and what to do as it runs out.
 *
 * The primary model allows 100,000 tokens a day (not just 12,000 a minute), and
 * the whole prompt is resent on every question — so the site can exhaust a day's
 * quota in a few dozen conversations and then answer nobody. Rather than let
 * that happen abruptly, spend is tracked and the assistant degrades in two
 * stages: shorter answers first, then the 8B model, which has its own separate
 * 500,000/day allowance.
 *
 * Degradation is deliberately silent. A visitor should never be shown the
 * site's accounting.
 *
 * Same discipline as `ratelimit.ts`: a 1s timeout, and if Redis is unreachable
 * we carry on at full quality rather than failing the request. The cost of
 * guessing wrong is a slightly shorter answer, which is not worth an outage.
 */

const DAILY_TOKEN_LIMIT = 100_000;

/** Below this, nothing changes. Above it, answers tighten. */
const TIGHTEN_AT = 0.65;
/** Above this, questions go to the model with the larger daily allowance. */
const FALLBACK_AT = 0.85;

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

export type BudgetStage = "normal" | "tighten" | "fallback";

export interface BudgetState {
  stage: BudgetStage;
  spent: number;
}

/** Rough but consistent, and it is the same estimator the corpus budget uses. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

function key(): string {
  return `tok:${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Read-only. Called before the provider request to pick a budget and a model.
 */
export async function currentBudget(): Promise<BudgetState> {
  if (!redis) return { stage: "normal", spent: 0 };

  try {
    const raw = await Promise.race([
      redis.get<number>(key()),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1_000)),
    ]);
    const spent = typeof raw === "number" ? raw : 0;
    const used = spent / DAILY_TOKEN_LIMIT;

    if (used >= FALLBACK_AT) return { stage: "fallback", spent };
    if (used >= TIGHTEN_AT) return { stage: "tighten", spent };
    return { stage: "normal", spent };
  } catch (error) {
    console.warn("[budget] Redis unavailable, assuming full quota:", error);
    return { stage: "normal", spent: 0 };
  }
}

/**
 * Fire-and-forget, after the stream has finished. Never awaited on the request
 * path: a slow Redis write must not delay a visitor's answer.
 *
 * Counted rather than read from the provider because the two providers report
 * usage differently and one may not report at all on a streamed response — an
 * estimate that always works beats an exact figure that sometimes vanishes.
 */
export function recordSpend(tokens: number): void {
  if (!redis || tokens <= 0) return;

  const k = key();
  void (async () => {
    try {
      await redis.incrby(k, tokens);
      // Two days, so the key cannot outlive its usefulness or pile up.
      await redis.expire(k, 60 * 60 * 48);
    } catch (error) {
      console.warn("[budget] could not record spend:", error);
    }
  })();
}

/** Tightening drops an answer one step; the floor is still a usable answer. */
export function applyStage(budget: number, stage: BudgetStage): number {
  if (stage === "normal") return budget;
  return Math.max(180, Math.round(budget * 0.6));
}
