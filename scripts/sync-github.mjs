/**
 * Pulls the public GitHub repositories into `src/content/repos.ts`.
 *
 *   npm run sync:github
 *
 * Deliberately NOT a build step. Builds stay deterministic and offline, and
 * GitHub being down can never break a deploy. Run it when you push a new repo,
 * check the diff, commit it.
 *
 * No authentication. Ten repos cost about twenty-two requests and the
 * unauthenticated limit is sixty an hour. Set GITHUB_TOKEN for headroom if you
 * are iterating on this script; it is never required.
 *
 * The hand-written case studies in `projects.ts` always win: any repo whose URL
 * already appears there is skipped rather than duplicated.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OWNER = "navyyshukla";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/content/repos.ts");

/**
 * The repositories worth showing a recruiter. Everything else on the account is
 * either empty, a duplicate, or a scratch experiment — listing those would read
 * as padding. Add a name here after running the script once to see it.
 */
const INCLUDE = [
  "CreatorJoy_AI_Pipeline",
  "n8n-Social-Media-Pipeline",
  "other-side-india",
  "rtsp-overlay-app",
  "AI-Music-Classifier-App",
  "ML-for-NextGen-Wireless-Networks",
  "stock_prediction_dash_app",
  "DigitRecognition",
  "AGROBOT",
  "Portfolio-Website",
];

/**
 * Entries that cannot come from a README. This site's repo has none — and the
 * interesting parts of it (the token budget, the guardrails) were never going to
 * be in one anyway. Hand-written, merged with the fetched entries, and safe from
 * the overwrite that clobbers hand edits in the generated file.
 */
const MANUAL = [
  {
    slug: "portfolio-website",
    title: "This Portfolio Site",
    summary:
      "The site you are reading, and the assistant answering you. Next.js 16 and React 19, statically generated, with a grounded assistant running on free-tier inference.",
    category: "Full-stack web",
    stack: [
      "TypeScript", "Next.js", "React", "Tailwind CSS", "Three.js",
      "Groq", "Gemini", "Upstash Redis", "Vercel",
    ],
    timeframe: "Jul — Aug 2026",
    repoUrl: "https://github.com/navyyshukla/Portfolio-Website",
    highlights: [
      "Assistant design: Answers are grounded in a corpus built from the site's own content files. There is no vector database and no embedding step — with a corpus this size, the relevant documents are selected by keyword match and pasted into the system prompt.",
      "Working inside a free tier: The primary model allows 100,000 tokens per day, and the corpus is resent on every question, so prompt size is the thing that decides how many visitors can be answered. Only the matching projects are sent, not the whole record.",
      "Guardrails: Scope is enforced by a positive allowlist rather than a keyword blacklist, which over-refuses on real recruiter questions. Visitor input is fenced as data, and requests are rate-limited per IP.",
      "Performance budget: First-load JavaScript on the homepage is held under 200 KB gzipped, which is what keeps Three.js, the chat UI and the markdown renderer behind dynamic imports.",
    ],
    keywords: [
      "portfolio", "website", "site", "this site", "typescript", "next.js", "nextjs",
      "react", "tailwind", "three.js", "webgl", "groq", "gemini", "llm", "assistant",
      "chatbot", "rag", "retrieval", "corpus", "prompt", "guardrails", "rate limit",
      "upstash", "redis", "vercel", "ssg", "static", "performance", "bundle",
      "accessibility", "free tier", "streaming",
    ],
  },
];

/**
 * Sections a recruiter never asks about. Dropping them is most of what keeps an
 * entry inside its token budget.
 */
const SKIP_HEADINGS =
  /^(installation|install|setup|set up|getting started|prerequisites|requirements|usage|how to run|running|run locally|quick start|license|licence|contributing|contribution|acknowledge?ments|credits|contact|folder structure|project structure|directory structure|table of contents|roadmap|todo|screenshots?|demo|video demo|walkthrough|deployment|deploy|project files|files|links|backend|frontend|environment|configuration|config|api( keys| reference| endpoints?)?|endpoints?|database|how to|future|expansions?|get|post|put|delete|patch|clone|import|notes?)\b/i;

/**
 * Sentences that survive extraction but say nothing, or worse. The placeholder
 * case is the dangerous one: DigitRecognition's README literally reads "test
 * accuracy of [Your Accuracy]%", and an assistant told that is authoritative
 * will quote it to a recruiter as a real number.
 */
const JUNK_SENTENCE = new RegExp(
  [
    /\[(your|insert|add|todo|tbd)[^\]]*\]/, // unfilled README placeholders
    /click here|watch the full|coming soon|lorem ipsum/,
    /^\s*(https?:\/\/|www\.)/,
    /^(create|clone|download|install|run|ensure|navigate|open|copy|paste|replace|set)\b/i, // instructions
    /\b(GET|POST|PUT|DELETE|PATCH)\s+\//, // endpoint docs
    /\bnpm (install|run)\b|\bpip install\b/,
  ]
    .map((r) => r.source)
    .join("|"),
  "i",
);

/** Surface-level tech names worth recording as stack when a README mentions them. */
const TECH = [
  "Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Express",
  "Python", "Flask", "Django", "FastAPI", "Streamlit", "Dash", "Plotly",
  "TensorFlow", "Keras", "PyTorch", "scikit-learn", "Scikit-learn", "NumPy",
  "Pandas", "OpenCV", "librosa", "Hugging Face", "Transformers", "DistilBERT",
  "MobileNetV2", "CNN", "Supabase", "PostgreSQL", "MongoDB", "Redis",
  "Firebase", "Docker", "Gunicorn", "Kubernetes", "Vercel", "Netlify",
  "GitHub Actions", "n8n", "Tailwind", "Three.js", "FFmpeg", "RTSP", "HLS",
  "WebRTC", "Arduino", "Raspberry Pi", "ElevenLabs", "OpenAI", "Gemini",
  "Groq", "LangChain", "Selenium", "BeautifulSoup", "yfinance", "MATLAB",
  "Jupyter", "Reinforcement Learning", "Deep Learning", "Machine Learning",
];

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio-sync",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

async function gh(url) {
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    const when = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : "later";
    throw new Error(`GitHub rate limit hit. Resets at ${when}. Nothing was written.`);
  }
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
  return res.json();
}

/** Markdown down to plain prose. Badges and code blocks are pure token cost. */
function clean(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")            // fenced code
    .replace(/^\s{4,}\S.*$/gm, "")             // indented code
    .replace(/<[^>]+>/g, "")                   // raw HTML
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "") // linked badges
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")   // links -> text
    .replace(/[*_`>]/g, "")                    // emphasis, quotes, ticks
    .replace(/^\s*[-=]{3,}\s*$/gm, "")         // rules
    .replace(/\|/g, " ")                       // table pipes
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu,
      "",
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split cleaned markdown into { heading, body } blocks. */
function sections(text) {
  const out = [];
  let current = { heading: "", lines: [] };
  for (const line of text.split("\n")) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      out.push(current);
      current = { heading: m[2].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  out.push(current);
  return out.map((s) => ({ heading: s.heading, body: s.lines.join("\n").trim() }));
}

function sentences(text, count) {
  const parts = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && !JUNK_SENTENCE.test(s));
  return parts.slice(0, count).join(" ");
}

/** Cheap similarity, only good enough to spot a highlight restating the summary. */
function overlaps(a, b) {
  const norm = (s) => new Set(s.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []);
  const [x, y] = [norm(a), norm(b)];
  if (!x.size || !y.size) return false;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / Math.min(x.size, y.size) > 0.6;
}

function titleFrom(name, firstHeading) {
  const cleaned = (firstHeading || "").replace(/[:.]$/, "").trim();
  // A README's own H1 is usually better copy than the repo slug, unless it is
  // just the slug again or a whole sentence.
  if (cleaned && cleaned.length <= 60 && cleaned.split(" ").length <= 8) return cleaned;
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectStack(text, languages) {
  const found = new Set(Object.keys(languages ?? {}).slice(0, 3));
  const hay = text.toLowerCase();
  for (const tech of TECH) {
    if (hay.includes(tech.toLowerCase())) found.add(tech);
  }
  // "JavaScript" alongside "React"/"Next.js" is noise; keep the specific one.
  if (found.has("Next.js")) found.delete("React");
  return [...found].slice(0, 9);
}

function categoryFrom(stack, text) {
  const hay = text.toLowerCase();
  if (/reinforcement learning|drl|neural network|cnn|classifier|deep learning/.test(hay))
    return "Machine learning";
  if (/pipeline|automation|workflow|n8n|scraper/.test(hay)) return "Automation · Pipeline";
  if (/dashboard|visuali[sz]/.test(hay)) return "Data viz";
  if (/arduino|sensor|robot|hardware/.test(hay)) return "Hardware · Robotics";
  if (stack.some((s) => /Next\.js|React|Express|Node/.test(s))) return "Full-stack web";
  return "Software project";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function stamp(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function timeframeFrom(created, pushed) {
  const a = stamp(created);
  const b = stamp(pushed);
  return a === b ? a : `${a} — ${b}`;
}

const STOPWORDS = new Set(
  ("the a an and or but for with without from into onto this that these those " +
    "is are was were be been being it its of to in on at by as via using use used " +
    "app application project repository repo built build builds full end user " +
    "based your our their you can will has have had also more most other about " +
    "which what when where how why not all any each both same than then them")
    .split(" "),
);

/**
 * Retrieval terms. These are never shown to anyone — they exist so that "the
 * robot project" or "has he used DQN?" finds the right document. Acronyms matter
 * disproportionately here, so they are pulled out explicitly.
 */
function keywordsFor(repo, stack, summary, highlights, text) {
  const acronyms = (text.match(/\b[A-Z]{2,6}\b/g) ?? []).map((a) => a.toLowerCase());
  const words = [repo.name.replace(/[-_]+/g, " "), ...stack, ...(repo.topics ?? [])]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/);

  // Distinctive words from the prose the assistant will actually be asked about.
  const prose = [summary, ...highlights]
    .join(" ")
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{3,}/g) ?? [];
  const counts = new Map();
  for (const w of prose) {
    if (STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const salient = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 18)
    .map(([w]) => w);

  return [
    ...new Set(
      [...words, ...acronyms, ...salient].filter(
        (w) => w.length > 2 && !STOPWORDS.has(w),
      ),
    ),
  ].slice(0, 34);
}

/** Rough but consistent; good enough to hold a budget line. */
const estimateTokens = (s) => Math.ceil(s.length / 4);

const PER_ENTRY_TOKEN_BUDGET = 450;
const TOTAL_TOKEN_BUDGET = 3500;

function buildEntry(repo, readme, languages, existingRepoUrls) {
  if (existingRepoUrls.has(repo.html_url.toLowerCase())) return null;

  const text = clean(readme ?? "");
  if (text.length < 200) {
    console.warn(`  skipped ${repo.name} — README too thin to say anything useful`);
    return null;
  }

  const blocks = sections(text);
  const firstHeading = blocks.find((b) => b.heading)?.heading ?? "";
  const lead = blocks.find((b) => b.body.length > 80)?.body ?? "";

  const summary =
    sentences(lead, 2) || repo.description || `${repo.name} — see the repository.`;

  const highlights = [];
  for (const block of blocks) {
    if (!block.heading || !block.body) continue;
    // Headings are often numbered ("1. Backend Setup"); strip that before
    // testing, or every skip pattern misses on its anchor.
    const heading = block.heading.replace(/^[\d.)\s]+/, "").trim();
    if (!heading || SKIP_HEADINGS.test(heading)) continue;
    const body = sentences(block.body, 2);
    if (body.length < 40) continue;
    // The first section usually restates the summary verbatim.
    if (overlaps(body, summary)) continue;
    if (highlights.some((h) => overlaps(h, body))) continue;
    highlights.push(`${heading}: ${body}`);
    if (highlights.length === 4) break;
  }

  const stack = detectStack(text, languages);
  const entry = {
    slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title: titleFrom(repo.name, firstHeading),
    summary,
    category: categoryFrom(stack, text),
    stack,
    timeframe: timeframeFrom(repo.created_at, repo.pushed_at),
    repoUrl: repo.html_url,
    ...(repo.homepage ? { liveUrl: repo.homepage } : {}),
    highlights,
    keywords: keywordsFor(repo, stack, summary, highlights, text),
  };

  const cost = estimateTokens(JSON.stringify(entry));
  if (cost > PER_ENTRY_TOKEN_BUDGET) {
    entry.highlights = entry.highlights.slice(0, 2);
    console.warn(`  trimmed ${repo.name} — ${cost} tokens over the ${PER_ENTRY_TOKEN_BUDGET} budget`);
  }
  return entry;
}

function render(entries) {
  const body = entries
    .map((e) => {
      const lines = [
        `  {`,
        `    slug: ${JSON.stringify(e.slug)},`,
        `    title: ${JSON.stringify(e.title)},`,
        `    summary: ${JSON.stringify(e.summary)},`,
        `    category: ${JSON.stringify(e.category)},`,
        `    stack: ${JSON.stringify(e.stack)},`,
        `    timeframe: ${JSON.stringify(e.timeframe)},`,
        `    repoUrl: ${JSON.stringify(e.repoUrl)},`,
        e.liveUrl ? `    liveUrl: ${JSON.stringify(e.liveUrl)},` : null,
        `    highlights: [`,
        ...e.highlights.map((h) => `      ${JSON.stringify(h)},`),
        `    ],`,
        `    keywords: ${JSON.stringify(e.keywords)},`,
        `  },`,
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n");

  return `/**
 * Repositories, generated from GitHub by \`npm run sync:github\`.
 *
 * GENERATED FILE — re-running the script overwrites it, hand edits included.
 * If an entry needs permanent wording, promote it to a full case study in
 * \`projects.ts\`; the script skips any repo already recorded there.
 *
 * These feed the assistant AND render at \`/projects/<slug>\`. The summaries and
 * highlights here are scraped, so anything a visitor reads is overridden by
 * \`repo-notes.ts\` — a hand-written file this script never touches. Add a note
 * there rather than editing wording here, which the next sync would discard.
 * \`keywords\` is retrieval-only and is never shown.
 * Last synced: ${new Date().toISOString().slice(0, 10)}
 */

export interface Repo {
  slug: string;
  title: string;
  summary: string;
  category: string;
  stack: string[];
  timeframe: string;
  repoUrl: string;
  liveUrl?: string;
  /** "Heading: one or two sentences", pulled from the README's own sections. */
  highlights: string[];
  /** Retrieval terms. Not shown to anyone. */
  keywords: string[];
}

export const repos: Repo[] = [
${body}
];
`;
}

async function main() {
  const projectsSrc = await readFile(path.join(ROOT, "src/content/projects.ts"), "utf8");
  const existingRepoUrls = new Set(
    [...projectsSrc.matchAll(/repoUrl:\s*"([^"]+)"/g)].map((m) => m[1].toLowerCase()),
  );
  console.log(`Case studies already cover ${existingRepoUrls.size} repos; those are skipped.\n`);

  const all = await gh(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=pushed`);
  const wanted = all.filter(
    (r) => INCLUDE.includes(r.name) && !r.fork && !r.archived && !r.private,
  );

  const missing = INCLUDE.filter((n) => !wanted.some((r) => r.name === n));
  if (missing.length) console.warn(`Not found on the account: ${missing.join(", ")}\n`);

  const entries = [];
  for (const repo of wanted) {
    const readmeMeta = await gh(`https://api.github.com/repos/${OWNER}/${repo.name}/readme`);
    if (!readmeMeta) {
      console.warn(`  skipped ${repo.name} — no README`);
      continue;
    }
    const languages = await gh(`https://api.github.com/repos/${OWNER}/${repo.name}/languages`);
    const readme = Buffer.from(readmeMeta.content, "base64").toString("utf8");
    const entry = buildEntry(repo, readme, languages, existingRepoUrls);
    if (!entry) continue;
    entries.push(entry);
    console.log(
      `  ${entry.slug.padEnd(34)} ~${String(estimateTokens(JSON.stringify(entry))).padStart(3)} tokens  ${entry.category}`,
    );
  }

  for (const manual of MANUAL) {
    if (entries.some((e) => e.slug === manual.slug)) continue;
    entries.push(manual);
    console.log(
      `  ${manual.slug.padEnd(34)} ~${String(estimateTokens(JSON.stringify(manual))).padStart(3)} tokens  ${manual.category} (hand-written)`,
    );
  }

  const total = entries.reduce((n, e) => n + estimateTokens(JSON.stringify(e)), 0);
  console.log(`\n${entries.length} entries, ~${total} tokens total.`);
  if (total > TOTAL_TOKEN_BUDGET) {
    throw new Error(
      `Over the ${TOTAL_TOKEN_BUDGET}-token budget. Nothing written. Trim INCLUDE or the highlight count — daily capacity depends on this staying small.`,
    );
  }

  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  await writeFile(OUT, render(entries), "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
