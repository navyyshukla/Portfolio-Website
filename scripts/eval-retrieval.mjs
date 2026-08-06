/**
 * Retrieval eval and prompt-size budget.
 *
 *   npm run eval:retrieval
 *
 * Gating the corpus traded one risk for another: the old design could never
 * fail to find a document because it always sent all of them. This is the check
 * that the new one finds the right ones. Run it after touching `retrieval.ts`,
 * `corpus.ts`, or anything under `src/content/`.
 *
 * Each case names the document that MUST appear in the attached set. A miss
 * means a visitor asking that question gets a thinner answer than the record
 * supports — the exact failure this eval exists to catch.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** [question, required document id] */
const CASES = [
  // Flagship case studies
  ["what news or NLP work has he done?", "project:other-side-of-india"],
  ["tell me about the India news aggregator", "project:other-side-of-india"],
  ["has he worked with DistilBERT or sentiment analysis?", "project:other-side-of-india"],
  ["what did he build with audio or music?", "project:music-genre-classifier"],
  ["explain the music genre classifier", "project:music-genre-classifier"],
  ["has he trained CNNs on spectrograms?", "project:music-genre-classifier"],
  ["any finance or stock market projects?", "project:stock-prediction-dashboard"],
  ["tell me about the stock dashboard", "project:stock-prediction-dashboard"],
  ["where has he used Dash or Plotly?", "project:stock-prediction-dashboard"],

  // Repositories — the whole point of this change
  ["what has he built with n8n?", "repo:n8n-social-media-pipeline"],
  ["any workflow automation experience?", "repo:n8n-social-media-pipeline"],
  ["tell me about the AI avatar pipeline", "repo:creatorjoy-ai-pipeline"],
  ["has he done voice cloning or video generation?", "repo:creatorjoy-ai-pipeline"],
  ["what streaming or video work has he done?", "repo:rtsp-overlay-app"],
  ["has he used MongoDB?", "repo:rtsp-overlay-app"],
  ["tell me about the RTSP overlay app", "repo:rtsp-overlay-app"],
  ["any research or published papers?", "repo:ml-for-nextgen-wireless-networks"],
  ["has he worked on reinforcement learning?", "repo:ml-for-nextgen-wireless-networks"],
  ["what does he know about wireless networks or satellites?", "repo:ml-for-nextgen-wireless-networks"],
  ["tell me about the robot", "repo:agrobot"],
  ["any hardware, Arduino or embedded projects?", "repo:agrobot"],
  ["what has he done with MNIST or digit recognition?", "repo:digitrecognition"],
  ["how was this website built?", "repo:portfolio-website"],
  ["what is this chatbot running on?", "repo:portfolio-website"],

  // Interests
  ["what does he do outside of work?", "interests"],
  ["tell me about his hobbies", "interests"],

  // Follow-ups: these carry no terms of their own, which is why the route feeds
  // the previous turns in. The eval mirrors that by joining the turns.
  ["tell me about the robot. how did it avoid obstacles?", "repo:agrobot"],
  ["what has he built with n8n? and how did the data get stored?", "repo:n8n-social-media-pipeline"],
];

/** Questions that must NOT pull a specific document — guards against a magnet. */
const NEGATIVE = [
  ["what does he do outside of work?", "project:stock-prediction-dashboard"],
  ["tell me about the robot", "repo:portfolio-website"],
];

const CORE_TOKEN_BUDGET = 1600;
const TOTAL_TOKEN_BUDGET = 2800;

/**
 * The corpus is TypeScript behind `server-only`, so it cannot be imported from a
 * plain node script. Type-stripping in a child process with the import stubbed
 * is the cheapest way to exercise the real code rather than a copy of it.
 */
const HARNESS = `
import { register } from "node:module";
register("data:text/javascript,${encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  let s = spec.startsWith("@/") ? spec.replace("@/", "${ROOT}/src/") : spec;
  // TS source omits extensions; node needs them.
  if (/^[.\\/]/.test(s) && !/\\.[a-z]+$/.test(s)) s += ".ts";
  return next(s, ctx);
}
`)}", import.meta.url);

const { buildCore, buildCorpusFor, allDocuments } = await import("${ROOT}/src/lib/corpus.ts");
const { selectDocuments } = await import("${ROOT}/src/lib/retrieval.ts");

const docs = allDocuments().map((d) => ({ id: d.id, strong: d.strong, weak: d.weak }));
const cases = ${JSON.stringify(CASES)};
const negative = ${JSON.stringify(NEGATIVE)};

const results = cases.map(([q, want]) => ({
  q, want,
  got: selectDocuments(q, docs, 3),
  tokens: Math.ceil(buildCorpusFor(q).length / 4),
}));
const negatives = negative.map(([q, avoid]) => ({
  q, avoid, got: selectDocuments(q, docs, 3),
}));

console.log(JSON.stringify({
  results,
  negatives,
  ids: docs.map((d) => d.id),
  coreTokens: Math.ceil(buildCore().length / 4),
}));
`;

const run = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--input-type=module", "--eval", HARNESS],
  { encoding: "utf8", cwd: ROOT, env: { ...process.env, NODE_NO_WARNINGS: "1" } },
);

if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(1);
}

const { results, negatives, ids, coreTokens } = JSON.parse(run.stdout.trim().split("\n").pop());

let failed = 0;
console.log(`${ids.length} documents: ${ids.join(", ")}\n`);

for (const { q, want, got, tokens } of results) {
  const hit = got.includes(want);
  if (!hit) failed++;
  const over = tokens > TOTAL_TOKEN_BUDGET;
  if (over) failed++;
  console.log(
    `${hit ? "ok  " : "MISS"} ${String(tokens).padStart(4)}t${over ? "!" : " "} ${q}`,
  );
  if (!hit) console.log(`      wanted ${want}, got ${got.join(", ") || "(nothing)"}`);
}

for (const { q, avoid, got } of negatives) {
  const bad = got.includes(avoid);
  if (bad) failed++;
  console.log(`${bad ? "BAD " : "ok  "}      ${q} — must not pull ${avoid}`);
}

const peak = Math.max(...results.map((r) => r.tokens));
const mean = Math.round(results.reduce((n, r) => n + r.tokens, 0) / results.length);

console.log(`\ncore ${coreTokens}t (budget ${CORE_TOKEN_BUDGET})`);
console.log(`prompt mean ${mean}t, peak ${peak}t (budget ${TOTAL_TOKEN_BUDGET})`);
console.log(`daily capacity at peak: ~${Math.floor(100_000 / (peak + 800))} questions on the 70B free tier`);

if (coreTokens > CORE_TOKEN_BUDGET) {
  console.log(`\ncore is over budget by ${coreTokens - CORE_TOKEN_BUDGET}t`);
  failed++;
}

if (failed) {
  console.log(`\n${failed} failure(s).`);
  process.exit(1);
}
console.log("\nAll cases pass.");
