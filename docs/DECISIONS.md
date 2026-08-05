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
