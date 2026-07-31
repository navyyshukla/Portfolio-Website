# State — where we are

Update this at the end of any session that changes something. It is the first
thing a new session should read.

**Last updated:** 2026-07-31 · branch `development` · all work pushed.

## Status: built and working

The site is complete and the assistant is live. What remains is polish and
content, not construction.

| Area | State |
|---|---|
| Homepage `/` | Done. Hero → Experience → Work → Skills → Contact |
| `/work/[slug]` | Done. 3 case studies written from the repo source |
| `/beyond-code` | Done. Interests + 3D story path |
| `/resume` | Done. Own control bar: zoom, reset, download, expand overlay |
| `/ask` + popup | Done. Docked, non-modal, streaming |
| `/api/chat` | **Live and verified against real providers** |
| Dot field | Done. Full-viewport, cursor spotlight, click ripples |
| Deployment | **Not deployed yet** |

## Open items

1. **Project preview panels are placeholders** — they say "Screenshot / demo".
   Real assets needed. See `docs/DECISIONS.md` → Project previews.
2. **`siteUrl` in `src/content/profile.ts` is a guess**
   (`naivedyashukla.vercel.app`). Canonical tags and the sitemap point at it —
   set the real URL before launch.
3. **Env vars are local only.** Before deploying, add all six from
   `.env.example` to Vercel for Production *and* Preview.
4. **Résumé vs site mismatch** the user should resolve: résumé says the Ethara
   AI internship ended Dec 2025, the content says Jan 2026. Site follows the
   user's form answer.
5. **3D story path is procedural primitives.** Reads as stylised toy, not
   Clash-of-Clans quality. Real quality needs modelled `.glb` assets.

## Free-tier limits that bite

The corpus is ~4,000 tokens and is resent every call, so **tokens-per-minute is
the binding constraint**, not requests/day. Measured from Groq's headers:
`llama-3.3-70b-versatile` 12,000 TPM (primary), `llama-3.1-8b-instant` 6,000
TPM (overflow). That is roughly 3 assistant questions per minute. A burst of
visitors degrades to "could not answer just now" — by design, never a crash.

## Verified behaviours — do not regress

Grounded answers; unrecorded questions declined with an email pointer; long
multi-part career questions answered in full; maths/coding declined; prompt
injection and false-owner claims refused without leaking; 429 + `Retry-After`;
413 on oversize and >12 turns; 400 on bad role or malformed body.
