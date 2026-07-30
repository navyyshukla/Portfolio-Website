# Portfolio Website — working rules

A personal portfolio for a software engineer targeting roles at large companies.
The full reasoning, with sources, is in `research/report.md`. This file is the
short, enforceable version. Every rule here traces to a finding in that report —
if you want to break one, read the corresponding section first.

## The one idea behind the whole design

**`/` must never require interaction to deliver information.** The documented
failure mode of developer portfolios is making a recruiter participate — type a
command, pick a mode, click to reveal — before they learn anything. The clever
material lives on `/beyond-code`, where it is opt-in. See report §4.1.

## Architecture

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind v4. No database,
  no CMS, no auth, no vector store. There is no dynamic data to justify them.
- **Exactly one API route is allowed: `/api/chat`.** It exists solely to keep
  the LLM key off the client. Adding a second API route requires the same bar
  of justification — write it down in `research/report.md` first.
- Routes: `/` (recruiter path) · `/work/[slug]` (case studies) ·
  `/beyond-code` (personal + game) · `/ask` (AI assistant) ·
  `/api/chat` (the one route handler).

## Content

- **All copy lives in `src/content/**`.** Components never hardcode
  user-facing strings. This is what makes a content pass a data edit rather
  than a component rewrite.
- **Nothing personal, hobby-related, or extracurricular renders on `/`.** The
  only pointer is the "Beyond code" nav item.
- **Maximum three project cards on `/`.** Depth belongs on `/work/[slug]`.
- Every case study answers: problem → decisions/trade-offs → outcome. The
  decisions section carries the most weight with technical readers.
- The hero holds the name, the one-line positioning statement, and two CTAs.
  Nothing else.

## Rendering & performance

- SSG only. Every dynamic segment carries `generateStaticParams` **and**
  `export const dynamicParams = false`.
- `'use client'` needs a reason, and belongs on **leaf** components only —
  never on a section wrapper.
- Heavy modules (the game, any canvas, any 3D) go behind `next/dynamic` with
  `{ ssr: false }`.
- **Budget: `/` first-load JS at or under 200 KB gzipped.** Measured baseline on
  2026-07-30 was **183 KB** with zero application dependencies — that is almost
  entirely the Next 16.2 + React 19 framework runtime, so the headroom for our
  own code is ~17 KB before this needs revisiting. Next 16 removed bundle size
  from `next build` output, so measure it: `npm start`, then sum the gzipped
  size of the chunks the page references, or use `npm run analyze`.
- `next/font` only. Never `@fontsource/*`, never a Google Fonts `<link>`.
- Exactly one image may carry `priority`. All images need explicit
  `width`/`height` (or `fill`) plus `sizes`.
- Third-party scripts: `afterInteractive` or `lazyOnload` only.
- Keep the `browserslist` field in `package.json` — it strips ~14 KiB of
  polyfills for features native in every supported browser.

## Motion & accessibility

- Every animation is gated on `useReducedMotion` or
  `@media (prefers-reduced-motion: reduce)`. Reduced mode gets a static or
  toned-down variant, **not a broken one**. `globals.css` has a global
  backstop, but components must still gate their own motion.
- Animate `transform` and `opacity` **only**. Never `width`, `height`, `top`,
  `left` — those force layout and are the main INP regression cause.
- Max 1–2 simultaneous animations per viewport.
- Anything that starts automatically and moves for more than 5s must be
  pausable.
- No audio without an explicit user gesture, and a low default gain.
- The game stays fully keyboard-playable and its canvas keeps a text
  alternative.
- Target Lighthouse Accessibility 100. Check colour contrast, don't eyeball it.

## AI Assistant & RAG Rules

The assistant is a grounded, zero-cost Q&A layer over this site's own content.
Full reasoning and sources: report §3.4. It is subordinate to every rule above —
if a rule here appears to conflict with the performance or accessibility
sections, those win.

**Homepage isolation — the hard constraint**

- **`/` stays at or under 200 KB gzipped first-load JS.** Measured 2026-07-30:
  **189,701 bytes (185.3 KB)** across 9 chunks, up from a 188,247-byte
  pre-assistant baseline.
- **The assistant may contribute at most 2 KB to `/`, and only the ⌘K hotkey
  shim.** A site-wide palette needs a site-wide key listener, so a literal 0 KB
  is impossible; 2 KB is the honest ceiling. Measured contribution:
  **1,454 bytes**. No chat UI, no markdown renderer, no `cmdk`, no voice code,
  and no corpus may ever reach the `/` bundle — all four were verified absent.
- `/` renders no assistant UI beyond the nav link. It must still answer every
  recruiter question with zero interaction.
- Measure before merging anything that touches this: `npm start`, sum the
  gzipped chunks `/` references, or `npm run analyze`.

**Lazy loading — mandatory**

- The ⌘K palette loads via `next/dynamic` on **first keypress**, never on mount.
- The chat UI lives on `/ask` and is reached only by routing there.
- Any voice module (`speechSynthesis`, `SpeechRecognition`) is dynamically
  imported and feature-detected. Never assume support.

**Grounding — `src/content/**` is the only source of truth**

- The corpus is built from `src/content/**` by `src/lib/corpus.ts`. **Never
  create a second knowledge base**, a duplicate JSON, or an ingestion script.
  Editing `projects.ts` must update the site and the assistant in one commit.
- `src/lib/corpus.ts` carries `import "server-only"`. Never remove it — it is
  what makes a corpus leak into a client bundle a build error rather than a
  silent 15 KB regression.
- **No vector DB, no embeddings.** The corpus is ~4,000 tokens; retrieval would
  add failure modes and dependencies to solve a problem that does not exist.
  Revisit only above ~50K tokens (report §3.4.2).
- The assistant answers **only** from the corpus. Not recorded → say so and
  point to the contact email. Never infer, estimate, or fill a gap.

**Guardrails — two layers, and one thing that is banned**

- Layer 1, deterministic, before any provider call: rate limit, message ≤ 1,000
  chars, ≤ 12 turns of history, and user text fenced in a delimited block that
  is treated as data, never instructions.
- Layer 2, system prompt: positive scope allowlist (career, experience,
  projects, skills, education, technical decisions, recorded interests);
  grounding contract; anti-extraction; refusal of general knowledge, maths,
  coding help, and unrecorded personal data.
- **Never add a keyword blacklist or an input injection classifier.** Research
  is unambiguous that both cause over-refusal on exactly the long, jargon-dense
  career questions this assistant exists to answer — guard models drop to ~60%
  accuracy on benign trigger-word inputs (report §3.4.4).
- The system prompt must always carry the **anti-over-refusal clause**: refuse
  on topic, never on form. Length, complexity and phrasing are never grounds
  for refusal.
- **The assistant gets no tools and no database access, ever.** This is the
  primary security property. It is what caps the blast radius of a successful
  injection at one off-topic paragraph.
- Model output renders through `rehype-sanitize` with `skipHtml`. No raw model
  HTML reaches the DOM.

**`/api/chat` — rate limiting is not optional**

- Per-IP sliding window, with `ephemeralCache` (blocked IPs then cost zero
  Redis commands) and `timeout: 1000` (the 5s default stalls every request when
  Redis is unreachable).
- A **separate global daily counter** guards the provider quota. Per-IP limits
  alone do not protect a shared free-tier cap from distributed traffic.
- Degradation: fail open on a Redis timeout, with an in-process limiter as a
  partial backstop. No provider credentials → `503` and the UI tells visitors
  to email instead. Never let a missing key surface as a stack trace.
- Groq primary, Gemini fallback on 429/5xx. Never hardcode a single model name
  as the only path — free catalogues change without notice.
- Keys are server-side only. A key in a client component is a build-blocking
  bug, not a review comment.

**Voice**

- Nothing speaks without an explicit user gesture. Read-aloud is a per-answer
  button, never automatic.
- Chrome halts `speechSynthesis` after ~15s: `pause()` then `resume()` on a
  14-second interval, started in `onstart`, cleared in `onend`.
- `getVoices()` returns empty on first call in Chrome — race `voiceschanged`
  against a ~2s timeout.
- Mic is push-to-talk only. Never continuous, never a wake word. Disclose
  before the first listen that Chrome sends audio to Google, and release the
  mic on stop.
- Read-aloud must not double-speak against the `aria-live` transcript region.
  Use `polite`, never `assertive`.

**UI**

- Full-width messages with subtle background differentiation. **Never SMS-style
  chat bubbles** — they signal "casual texting" and undermine the tool framing.
- **Never a floating bottom-right widget.**
- Every action has a keyboard path. `Cmd+Enter` sends, `Esc` cancels.

## SEO

- All metadata flows through `src/lib/seo.ts`. No per-page boilerplate.
- The `<h1>` matches the `<title>`; the positioning line carries the stack
  keywords a recruiter would screen for.

## Maintenance

- No broken links, ever — stale content is a documented negative signal.
  Verify every repo and demo link before merging.

## Git Branch Strategy & Preview Deployments

- **Active Development Branch:** All feature development, refactoring, and experimental code MUST happen on the `development` branch (or feature branches merged into `development`).
- **Never Commit Directly to `main`:** The `main` branch is reserved strictly for production-ready, verified code.
- **Preview Deployments:** Pushes to `development` trigger a staging preview build on Vercel. Test changes on the preview URL before promoting code to production.
- **Production Releases:** Merge `development` into `main` ONLY after verifying the preview URL, running all local checks, and confirming feature stability.

## Workflow & Guidance Rules

- **Check environment & rules first:** Before writing code for any task, review `CLAUDE.md` guardrails and confirm you are on the `development` branch (`git checkout development`).
- **Autonomous Verification:** After making code changes, run `npm run typecheck`, `npm run lint`, and verify `npm run build` (or bundle check if homepage code was touched).
- **Git Commits:** Once a task passes verification, automatically commit and push the changes to `development` with a clean conventional commit message (e.g., `feat: ...`, `fix: ...`).
- **Always Suggest Next Step:** At the end of EVERY response, give a concise 1-sentence recap of what was completed and explicitly state the **SINGLE EXACT NEXT STEP** to execute the project roadmap.

## Commands

```
npm run dev        # development
npm run build      # production build
npm start          # serve the production build (Lighthouse against THIS, not dev)
npm run typecheck  # tsc --noEmit
npm run lint
npm run analyze    # ANALYZE=true next build — bundle treemap
```
