# Decisions — why the rules are what they are

Read this only when you want to change a rule in `CLAUDE.md`. Full evidence
with citations is in `research/report.md`.

## `/` never requires interaction
The documented failure mode of developer portfolios is making a recruiter
participate before they learn anything. Terminal-UI portfolios lose recruiters;
their own authors say so. Clever material lives on `/beyond-code`, opt-in.

## No vector database
Still true, and not the thing that changed. There is no embedding service, no
vector store, no chunk tuning and no re-index step. Retrieval is weighted term
overlap over ~11 documents in `src/lib/retrieval.ts` — a pure function, no
network, no state. Revisit only if the corpus reaches a size where lexical
matching stops discriminating (a blog would do it).

## The corpus is gated by relevance, not sent whole *(reversed Aug 2026)*
The original rule was to stuff the whole corpus into every prompt, on the
grounds that ~4,000 tokens is far below where retrieval earns its complexity
and that sending everything makes retrieval failure impossible. The second half
of that was the real prize, and giving it up needed a better reason than size.

The reason is a limit that was never recorded: the Groq free tier caps
`llama-3.3-70b-versatile` at **100,000 tokens per day**, not just 12K/minute.
The prompt is resent on every question, so prompt size — not request count — is
what decides how many visitors can be answered. At ~5,000 tokens a question the
whole site was capped near **20 questions a day**, and adding the GitHub
repositories would have halved that.

Gating inverts it: measured mean 2,057 tokens and peak 2,718 (`npm run
eval:retrieval`), so ~28 questions a day *with* four times the project
coverage. Cheaper and broader at once.

What replaces the old safety property:
- **The project index is always sent.** Every project is named in core on every
  request, so a miss costs depth, never existence. The assistant cannot claim a
  real project is unrecorded.
- **Retrieval reads the last three user turns**, not just the newest, so
  "tell me more about that" resolves.
- **A token budget, not just a count cap.** Documents are attached in relevance
  order until ~1,250 tokens are spent; three long case studies cost more than
  three repository entries, so a count alone was not a bound.
- **An eval, because "impossible" became "tested".** `scripts/eval-retrieval.mjs`
  holds 28 recruiter questions with the document each must attach, plus negative
  cases against magnet documents. It fails the run on a miss or a budget breach.

## Answer length is a prompt rule; `max_tokens` is only a fuse
`max_tokens` does not make a model concise — it cuts it off mid-sentence, and a
long answer chopped in half is worse than a short complete one. So the system
prompt asks for three to five sentences and `answerBudget()` sets a ceiling
*above* that target, sized from the question: 250 for a short single-clause
question, 420 normally, 700 when it genuinely asks for several things.

The sizing is deterministic — question length, number of `?`, conjunctions
joining clauses, phrases like "compare" or "walk me through". No classifier: a
classifier here would be a second model call to save tokens, and it can be wrong
about a question it has no business judging.

It only ever *grants* room. A long multi-part question gets the largest budget,
never a shorter answer — otherwise it would contradict the rule that length and
complexity are never grounds for refusal.

## Daily token spend degrades in two stages
The 70B allows 100K tokens/day. Rather than serve everyone fully until the
quota dies, `src/lib/budget.ts` counts spend and tightens: past 65% answers
shrink one step, past 85% questions route to the 8B, which has its own 500K/day.
Silent by design — a visitor is never shown the site's accounting.

Spend is *estimated* (chars ÷ 4), not read from provider usage: the two
providers report differently and one may not report at all on a streamed
response. An estimate that always works beats an exact figure that sometimes
vanishes. Counting happens as the stream passes through, and the Redis write is
fire-and-forget so it cannot delay an answer.

## History is trimmed, because it costs more than output at depth
Every prior turn is resent as input, so a 12-turn conversation ran ~6,800 input
tokens for one question — far more than the answer itself. The last two
exchanges stay verbatim; older answers keep their first 400 characters, oldest
dropped first. Capping output alone would have left the larger leak open.

## Theme: `data-theme` overrides, OS decides by default
The palettes already existed but were reachable only through
`prefers-color-scheme`. An explicit choice is stored in `localStorage` and
stamped on `<html>` as `data-theme`, which outranks the media query via
`:root:not([data-theme])`. Nothing stored means the OS still decides, live.

No `next-themes` — it is four lines of inline script plus a `useSyncExternalStore`
leaf, against a 200 KB budget. The theme lives in the DOM and the OS, not in
React state, so it is read as an external store rather than mirrored.

The inline script in `layout.tsx` is the one blocking script on the page and
must stay: without it, a visitor who chose light gets a dark flash on every
navigation, because the server cannot know the stored choice.

Two pre-existing bugs surfaced while doing this and were fixed: the Tailwind
`@theme` block held static dark hexes, so utilities like `bg-surface` stayed
dark in light mode; and `--color-border` was never defined at all, so the eight
`border-border` usages fell back to `currentColor`. Both now point at the
existing variables — no new colour values.

## GitHub repositories are synced, not fetched
`npm run sync:github` writes `src/content/repos.ts`; the output is committed.
Deliberately not a build step and not a runtime call: builds stay deterministic
and offline, GitHub being down can never break a deploy, and the assistant
still has no tools and no network of its own. Unauthenticated — ten repos cost
~22 requests against a 60/hour limit, so no token and no secret is involved.
Hand-written case studies in `projects.ts` win over any repo with the same URL.

## No keyword blacklist on assistant input
The NotInject benchmark (ACL 2025) shows guard models drop to ~60% accuracy —
near random — on benign inputs containing trigger words. A blacklist would
refuse exactly the long, jargon-dense recruiter questions the assistant exists
to answer. Scope is a positive allowlist instead, plus an explicit clause that
length and complexity are never grounds for refusal.

## Groq primary, Gemini last
Visitor questions transit the provider. Groq does not retain or train on
inference data by default; Google's free tier is marked "used to improve our
products". Model order within Groq is set by measured TPM, not marketing RPD.

## Own control bar on the résumé
The browser's PDF toolbar is drawn inside the iframe and is unreachable from
the page, and differs by embed type — `<iframe>` loads Chrome's full viewer,
`<object>` the minimal one. Suppressing it and owning the controls is the only
way to get consistency and to put expand beside zoom.

## Dot field paints above the page
Behind the content, every opaque card hid it. As an overlay with
`pointer-events: none` it reads everywhere regardless of what is beneath.
Note: `<canvas>` is a replaced element — it needs explicit `width`/`height`,
`inset: 0` alone leaves it at its intrinsic 300×150.

## Project previews — open design question
The panels currently say "Screenshot / demo". Options considered, cheapest
first: static screenshot in a browser chrome frame; animated WebM/GIF loop
(WebM is ~10× smaller than GIF and should be `<video autoplay muted loop
playsinline>`); scroll-on-hover full-page capture; live embedded iframe.
Assets already in the user's repos: `training_history.png` in
`AI-Music-Classifier-App` (real accuracy/loss curves) and all three projects
have live deployed URLs that can be captured.
