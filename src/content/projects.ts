/**
 * Projects.
 *
 * Exactly three appear on "/" (see `featuredProjects`). Depth lives on
 * /work/[slug], which is where the engineer on the interview panel actually
 * reads. Every case study answers: problem -> decisions/trade-offs -> outcome.
 *
 * A project that failed, written up honestly, is a legitimate entry here — it
 * is often the most interesting thing on a portfolio.
 */

export interface CaseStudySection {
  heading: string;
  body: string[];
}

export interface Project {
  slug: string;
  title: string;
  /** One line. Shown on the card at "/". */
  summary: string;
  /** Technologies. Doubles as recruiter-screenable keywords. */
  stack: string[];
  /** e.g. "2026" or "2025 - present". */
  timeframe: string;
  /** The concrete result. Numbers beat adjectives. */
  outcome: string;
  repoUrl?: string;
  liveUrl?: string;
  /** The /work/[slug] body. Keep the problem -> decisions -> outcome shape. */
  caseStudy: CaseStudySection[];
}

export const projects: Project[] = [
  // TODO(content): replace these three placeholders with real projects.
  {
    slug: "project-one",
    title: "TODO: Project One",
    summary: "TODO: One line on what it does and why it mattered.",
    stack: ["TODO", "TODO"],
    timeframe: "TODO",
    outcome: "TODO: The measurable result.",
    caseStudy: [
      {
        heading: "The problem",
        body: ["TODO: What was broken or missing, and for whom."],
      },
      {
        heading: "Decisions and trade-offs",
        body: [
          "TODO: What you chose, what you rejected, and why. This section carries the most weight with technical readers.",
        ],
      },
      {
        heading: "Outcome",
        body: ["TODO: What happened. Include numbers where you have them."],
      },
    ],
  },
  {
    slug: "project-two",
    title: "TODO: Project Two",
    summary: "TODO: One line.",
    stack: ["TODO"],
    timeframe: "TODO",
    outcome: "TODO",
    caseStudy: [
      { heading: "The problem", body: ["TODO"] },
      { heading: "Decisions and trade-offs", body: ["TODO"] },
      { heading: "Outcome", body: ["TODO"] },
    ],
  },
  {
    slug: "project-three",
    title: "TODO: Project Three",
    summary: "TODO: One line.",
    stack: ["TODO"],
    timeframe: "TODO",
    outcome: "TODO",
    caseStudy: [
      { heading: "The problem", body: ["TODO"] },
      { heading: "Decisions and trade-offs", body: ["TODO"] },
      { heading: "Outcome", body: ["TODO"] },
    ],
  },
];

/** Never more than three. Signal-to-noise drops sharply after the third card. */
export const featuredProjects = projects.slice(0, 3);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
