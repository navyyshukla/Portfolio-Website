import "server-only";

import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { experience, education } from "@/content/experience";
import { skillGroups } from "@/content/skills";
import { beyond } from "@/content/beyond";

/**
 * The assistant's entire knowledge base, built from `src/content/**`.
 *
 * `import "server-only"` above is load-bearing: it turns "a client component
 * imported the corpus and shipped ~15 KB of content to every browser" from a
 * code-review miss into a build error. Do not remove it.
 *
 * There is deliberately no vector store, no embedding step and no ingestion
 * script. The corpus is roughly 4,000 tokens — an order of magnitude below the
 * size where retrieval starts paying for itself — so the whole thing goes into
 * the system prompt and retrieval failure becomes structurally impossible.
 * See report §3.4.2, including the trigger for revisiting this (~50K tokens).
 */

function section(title: string, body: string): string {
  return `<section name="${title}">\n${body.trim()}\n</section>`;
}

export function buildCorpus(): string {
  const identity = section(
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

  const work = section(
    "projects",
    projects
      .map((p) =>
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
      )
      .join("\n\n"),
  );

  const roles = section(
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

  const study = section(
    "education",
    education
      .map((e) =>
        [
          `${e.qualification} — ${e.institution} (${e.timeframe})`,
          e.detail,
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n"),
  );

  const skills = section(
    "skills",
    skillGroups.map((g) => `${g.label}: ${g.items.join(", ")}`).join("\n"),
  );

  const interests = section(
    "interests",
    [
      beyond.intro,
      ...beyond.entries.map((e) => `## ${e.title} (${e.kind})\n${e.body}`),
      "## Life milestones",
      ...beyond.story.stages.map(
        (st) => `${st.year}: ${st.title}${st.detail ? ` — ${st.detail}` : ""}`,
      ),
    ].join("\n\n"),
  );

  return [identity, work, roles, study, skills, interests].join("\n\n");
}
