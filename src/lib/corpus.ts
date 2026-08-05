import "server-only";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { repos } from "@/content/repos";
import { experience, education } from "@/content/experience";
import { skillGroups } from "@/content/skills";
import { beyond } from "@/content/beyond";
import { selectDocuments, type Retrievable } from "./retrieval";

/**
 * The assistant's knowledge base, built from `src/content/**`.
 *
 * `import "server-only"` above is load-bearing: it turns "a client component
 * imported the corpus and shipped the whole record to every browser" from a
 * code-review miss into a build error. Do not remove it.
 *
 * Two layers, and the split is the whole design:
 *
 *   CORE      identity, experience, education, skills, and a one-line index of
 *             every project. Always sent.
 *   DOCUMENTS full case studies, repository detail, personal interests. Only
 *             the two or three matching the question are sent.
 *
 * The reason is the token ceiling, not corpus size: the primary free-tier model
 * allows 100,000 tokens a day and the prompt is resent on every question, so
 * prompt size decides how many visitors can be answered. See docs/DECISIONS.md.
 *
 * The index is what makes a retrieval miss survivable. Every project is named in
 * core on every request, so the assistant can always say what exists and only
 * ever lacks depth — it can never claim a real project isn't recorded. There is
 * still no vector store and no embedding step; see `retrieval.ts`.
 */

/** Attaching more than this rebuilds the prompt bloat this exists to avoid. */
const MAX_DOCUMENTS = 3;

/**
 * A count cap alone is not a budget: three long case studies cost more than
 * twice what three repository entries do. Documents are attached in relevance
 * order until this is spent, so the worst case is bounded rather than hopeful.
 * The top match always goes in, whatever it costs.
 */
const DETAIL_TOKEN_BUDGET = 1250;
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

function section(title: string, body: string): string {
  return `<section name="${title}">\n${body.trim()}\n</section>`;
}

/* -------------------------------------------------------------------------- */
/* Core — always sent                                                          */
/* -------------------------------------------------------------------------- */

function identity(): string {
  return section(
    "identity",
    [
      `Name: ${profile.name}`,
      `Role: ${profile.role}`,
      `Positioning: ${profile.positioning}`,
      `Location: ${profile.location}`,
      `Contact email: ${profile.email}`,
      `Bio: ${profile.bio}`,
      `Links: ${profile.socials.map((s) => `${s.label} — ${s.href}`).join(" | ")}`,
    ].join("\n"),
  );
}

function roles(): string {
  return section(
    "experience",
    experience
      .map((e) =>
        [
          `## ${e.role} — ${e.organisation} (${e.timeframe})`,
          ...e.bullets.map((b) => `- ${b}`),
          `Stack: ${e.stack.join(", ")}`,
        ].join("\n"),
      )
      .join("\n\n"),
  );
}

function study(): string {
  return section(
    "education",
    education
      .map((e) =>
        [`${e.qualification} — ${e.institution} (${e.timeframe})`, e.detail]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n"),
  );
}

function skills(): string {
  return section(
    "skills",
    skillGroups.map((g) => `${g.label}: ${g.items.join(", ")}`).join("\n"),
  );
}

/**
 * One line per project, every project. Cheap enough to always send, and the
 * reason a retrieval miss degrades to "less detail" rather than "denies it
 * exists".
 */
function index(): string {
  const lines = [
    ...projects.map(
      (p) => `- ${p.title} [${p.slug}] — ${p.summary} (${p.stack.join(", ")})`,
    ),
    ...repos.map(
      (r) => `- ${r.title} [${r.slug}] — ${r.summary} (${r.stack.join(", ")})`,
    ),
  ];
  return section(
    "project_index",
    [
      "Every project on record. Detail for the ones relevant to this question follows below.",
      ...lines,
    ].join("\n"),
  );
}

export function buildCore(): string {
  return [identity(), roles(), study(), skills(), index()].join("\n\n");
}

/* -------------------------------------------------------------------------- */
/* Documents — sent only when the question matches                             */
/* -------------------------------------------------------------------------- */

interface Document extends Retrievable {
  render: () => string;
}

function projectDocuments(): Document[] {
  return projects.map((p) => ({
    id: `project:${p.slug}`,
    strong: [p.title, p.slug.replaceAll("-", " "), p.category, ...p.stack].join(" "),
    weak: [p.summary, ...p.caseStudy.flatMap((s) => [s.heading, ...s.body])].join(" "),
    render: () =>
      [
        `## ${p.title} (slug: ${p.slug})`,
        `Timeframe: ${p.timeframe}`,
        `Stack: ${p.stack.join(", ")}`,
        `Summary: ${p.summary}`,
        `Category: ${p.category}`,
        p.repoUrl ? `Repository: ${p.repoUrl}` : null,
        p.liveUrl ? `Live: ${p.liveUrl}` : null,
        ...p.caseStudy.map((s) => `### ${s.heading}\n${s.body.join("\n")}`),
        `Case study page: /work/${p.slug}`,
      ]
        .filter(Boolean)
        .join("\n"),
  }));
}

function repoDocuments(): Document[] {
  return repos.map((r) => ({
    id: `repo:${r.slug}`,
    strong: [r.title, r.slug.replaceAll("-", " "), r.category, ...r.stack, ...r.keywords].join(" "),
    weak: [r.summary, ...r.highlights].join(" "),
    render: () =>
      [
        `## ${r.title} (slug: ${r.slug})`,
        `Timeframe: ${r.timeframe}`,
        `Stack: ${r.stack.join(", ")}`,
        `Summary: ${r.summary}`,
        `Category: ${r.category}`,
        `Repository: ${r.repoUrl}`,
        r.liveUrl ? `Live: ${r.liveUrl}` : null,
        ...r.highlights.map((h) => `- ${h}`),
        "Recorded from the repository itself; there is no case study page for this one.",
      ]
        .filter(Boolean)
        .join("\n"),
  }));
}

function interestsDocument(): Document {
  const body = [
    beyond.intro,
    ...beyond.entries.map((e) => `## ${e.title} (${e.kind})\n${e.body}`),
    "## Life milestones",
    ...beyond.story.stages.map(
      (st) => `${st.year}: ${st.title}${st.detail ? ` — ${st.detail}` : ""}`,
    ),
  ].join("\n\n");

  return {
    id: "interests",
    strong:
      "interests hobbies personal beyond code football sport music travel reading " +
      "life story milestones outside work free time fun",
    weak: body,
    render: () => body,
  };
}

export function allDocuments(): Document[] {
  return [...projectDocuments(), ...repoDocuments(), interestsDocument()];
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Core plus the documents matching `query`.
 *
 * `query` should be the visitor's recent turns, not just the newest one — "tell
 * me more about that" carries no terms of its own and would otherwise retrieve
 * nothing. The route is responsible for passing enough context.
 */
export function buildCorpusFor(query: string): string {
  const documents = allDocuments();
  const selected = selectDocuments(query, documents, MAX_DOCUMENTS);

  // Nothing matched — a greeting, or a question with no shared vocabulary. Lead
  // with the flagship case studies rather than sending nothing.
  const ids = selected.length
    ? selected
    : projects.slice(0, 2).map((p) => `project:${p.slug}`);

  const ranked = documents
    .filter((d) => ids.includes(d.id))
    // Preserve relevance order rather than declaration order.
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  const attached: string[] = [];
  let spent = 0;
  for (const doc of ranked) {
    const rendered = doc.render();
    const cost = estimateTokens(rendered);
    if (attached.length && spent + cost > DETAIL_TOKEN_BUDGET) break;
    attached.push(rendered);
    spent += cost;
  }

  const detail = attached.join("\n\n");

  return [buildCore(), section("relevant_detail", detail)].join("\n\n");
}
