import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Layered rate limiting for `/api/chat`. See report §3.4.5.
 *
 * Three things are being protected, and they need different mechanisms:
 *   1. Per-visitor abuse       → per-IP sliding window (Upstash)
 *   2. The shared free-tier quota → a global daily counter, because per-IP
 *      limits do nothing against distributed traffic
 *   3. Availability when Redis is unreachable → an in-process backstop
 *
 * The in-process limiter is explicitly a BACKSTOP, not an equivalent. Vercel
 * Fluid Compute shares module scope across invocations on one instance, so it
 * catches a single-source flood — but Vercel scales out and each new instance
 * starts at zero. It is not a substitute for Redis.
 */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

/** Blocked identifiers get cached here, so repeat hits cost zero Redis commands. */
const ephemeralCache = new Map<string, number>();

const redis = hasUpstash ? Redis.fromEnv() : null;

const perIp = redis
  ? new Ratelimit({
      redis,
      // Sliding window: no 2x burst at the window seam that fixed window allows.
      limiter: Ratelimit.slidingWindow(8, "1 m"),
      prefix: "rl:chat:ip",
      ephemeralCache,
      // The 5s default stalls every request when Redis is unreachable.
      timeout: 1_000,
      analytics: false,
    })
  : null;

/** Guards the provider's daily cap, which per-IP limits cannot protect. */
const perDay = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(2_000, "1 d"),
      prefix: "rl:chat:global",
      ephemeralCache,
      timeout: 1_000,
      analytics: false,
    })
  : null;

// --- In-process backstop -----------------------------------------------------

const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 8;
const hits = new Map<string, number[]>();

function memoryLimit(id: string): boolean {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(id, recent);

  // Opportunistic cleanup so the Map cannot grow without bound.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length <= MAX_IN_WINDOW;
}

// --- Public API --------------------------------------------------------------

export interface LimitResult {
  ok: boolean;
  /** Seconds until the caller may retry. */
  retryAfter: number;
  reason?: "ip" | "daily";
}

export function clientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function checkRateLimit(id: string): Promise<LimitResult> {
  // The backstop runs first and always: it is free, and it means a Redis
  // timeout (which fails open below) cannot leave the quota fully uncapped.
  if (!memoryLimit(id)) {
    return { ok: false, retryAfter: 60, reason: "ip" };
  }

  if (!perIp || !perDay) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_* not set — running on the in-process backstop only.",
      );
    }
    return { ok: true, retryAfter: 0 };
  }

  try {
    const daily = await perDay.limit("global");
    if (!daily.success) {
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((daily.reset - Date.now()) / 1000)),
        reason: "daily",
      };
    }

    const ip = await perIp.limit(id);
    if (!ip.success) {
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((ip.reset - Date.now()) / 1000)),
        reason: "ip",
      };
    }

    return { ok: true, retryAfter: 0 };
  } catch (error) {
    // Fail open for availability — the backstop above already ran.
    console.warn("[ratelimit] Redis unavailable, falling back to in-process:", error);
    return { ok: true, retryAfter: 0 };
  }
}
