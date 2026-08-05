# State — where we are

Update this at the end of any session that changes something. It is the first
thing a new session should read.

**Last updated:** 2026-08-05 · branch `development` · scroll fix and the
relevance-gated corpus are committed; answer budgets and the theme toggle are
**uncommitted**.

## Status: built and working

The site is complete and the assistant is live. What remains is polish and
content, not construction.

| Area | State |
|---|---|
| Homepage `/` | Done. Hero → Experience → Work → Skills → Contact |
| `/work/[slug]` | Done. 3 case studies written from the repo source |
| `/beyond-code` | Done. Interests + 3D story path |
| `/resume` | Done. Own control bar: zoom, reset, download, expand overlay |
| `/ask` + popup | Done. Docked, non-modal, streaming, no scroll chaining |
| `/api/chat` | **Live and verified against real providers** |
| Assistant corpus | 10 projects. Relevance-gated: core + matching detail |
| GitHub sync | `npm run sync:github` → `src/content/repos.ts`, committed |
| Answer length | 3–5 sentences; cap sized per question, shrinks with spend |
| Theme | Follows the OS; nav toggle overrides and is remembered |
| Dot field | Done. Full-viewport, cursor spotlight, click ripples |
| Deployment | **Not deployed yet** |

## Open items

1. **Project preview panels are placeholders** — they say "Screenshot / demo".
   Real assets needed. See `docs/DECISIONS.md` → Project previews.
2. **`siteUrl` in `src/content/profile.ts` is a guess**
   (`naivedyashukla.vercel.app`). Canonical tags and the sitemap point at it —
   set the real URL before launch.
3. **Env vars are local only.** Before deploying, add all seven from
   `.env.example` to Vercel for Production *and* Preview. Skipping the two
   Upstash ones silently drops `/api/chat` to the per-instance in-memory
   limiter.
4. **Résumé vs site mismatch** the user should resolve: résumé says the Ethara
   AI internship ended Dec 2025, the content says Jan 2026. Site follows the
   user's form answer.
5. **3D story path is procedural primitives.** Reads as stylised toy, not
   Clash-of-Clans quality. Real quality needs modelled `.glb` assets.

## Free-tier limits that bite

Groq's free tier has four limits, and **the daily token ceiling is the one that
decides how many visitors get answered**:

| Model | RPM | RPD | TPM | TPD |
|---|---|---|---|---|
| `llama-3.3-70b-versatile` (primary) | 30 | 1,000 | 12,000 | **100,000** |
| `llama-3.1-8b-instant` (overflow) | 30 | 14,400 | 6,000 | **500,000** |

RPD is a red herring: the prompt is resent on every question, so 1,000
requests/day is unreachable — the token ceiling binds first. At the measured
mean prompt of ~2,057 tokens plus 800 output, the primary model covers roughly
**35 questions a day** (~28 at the 2,718-token peak), then overflow carries
several hundred more. TPM still caps bursts at ~4 questions/minute.

This is why the corpus is gated rather than sent whole. **Prompt size is the
capacity budget** — anything that grows it costs visitor answers directly. Run
`npm run eval:retrieval` to see the current numbers; it fails on a budget
breach. A burst degrades to "could not answer just now", never a crash.

## Verified behaviours — do not regress

**Multi-turn conversation.** A follow-up after a long answer must work. It used
to 413 with "Messages are limited to 1000 characters": the cap was applied to
assistant turns, which the client resends as history, so any answer over ~1,000
characters killed the next turn. The cap is visitor input only now. Measured
after: a 1,680-character assistant turn returns 200; a 9,000-character one is
still rejected; a 1,200-character *question* is still rejected.

**Answer length** (measured live): "Has he used MongoDB?" → 135 output tokens;
"Compare his ML projects and say which shows the most depth" → 221. Both ended
on a complete sentence. The old ceiling was 800 for everything.

**Budget stages** (seeded in Redis): 60% → normal, 70% → tighten (700 cap
becomes 420), 90% → fallback, and a live request at 90% still answered.

**Theme** (Brave, both modes): OS default works either way with nothing stored;
the toggle overrides and survives reload; with a stored light choice on a dark
OS the first painted `--ground` is `#eeeae4`, so there is no flash; the ⌘K
palette follows the theme (white / `#121c31`) with a hairline border.

**Corpus gating** (`npm run eval:retrieval`, 28 questions + 2 negative cases):
every question attaches the document it is about; core 1,489 tokens; prompt mean
2,057, peak 2,718. The index naming all 10 projects is always sent, so a
retrieval miss costs depth, never existence — if you change the scoring, the
eval is the thing that catches a regression.

Grounded answers; unrecorded questions declined with an email pointer; long
multi-part career questions answered in full; maths/coding declined; prompt
injection and false-owner claims refused without leaking; 429 + `Retry-After`;
413 on oversize and >12 turns; 400 on bad role or malformed body.

**Chat popup scroll** (measured in Brave, `scrollY` 900, `deltaY` 500): the page
holds at 900 with the pointer anywhere on the panel — header, transcript or
composer — while the transcript still scrolls itself and the page still scrolls
normally outside the panel, because the popup is deliberately non-modal.

The trap, if you touch this again: `data-lenis-prevent` does **not** stop
chaining. It only makes Lenis release the wheel event, and the browser's native
scroll then moves the page. The transcript escapes that because it is scrollable
and carries `overscroll-behavior: contain`; everywhere else the wheel handler in
`ChatPopup.tsx` swallows the event. CSS alone cannot fix this — Lenis
preventDefaults on `window` first.
