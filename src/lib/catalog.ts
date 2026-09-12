/**
 * One list of everything, assembled from the two content sources.
 *
 * Projects live in `projects.ts` as hand-written case studies and render at
 * `/work/<slug>`; repositories live in the generated `repos.ts` and render at
 * `/projects/<slug>`. The catalogue page, the sitemap and the command palette
 * all need the union, and each deriving it separately is how the three quietly
 * stop agreeing. So it is derived once, here.
 *
 * Deliberately **no** `import "server-only"`: unlike `corpus.ts`, this is meant
 * to render, and the command palette is a client component. Everything it
 * touches is already public — nothing from the corpus passes through here.
 */

import { projects, type ProjectMedia, type ProjectTerminal } from "@/content/projects";
import { repos } from "@/content/repos";
import { repoNotes } from "@/content/repo-notes";

export interface CatalogEntry {
  slug: string;
  title: string;
  summary: string;
  category: string;
  stack: string[];
  timeframe: string;
  /** Where this entry lives on the site. */
  href: string;
  repoUrl?: string;
  liveUrl?: string;
  /** Case studies only — repositories have nothing captured. */
  media?: ProjectMedia;
  /** A sample of the project's own output, for projects with no screen. */
  terminal?: ProjectTerminal;
  /** True for the entries that also appear on "/". */
  featured: boolean;
  /** Body text on the entry's own page. */
  highlights: string[];
  /** Curated name for the generated cover, where the title is a sentence. */
  coverTitle?: string;
  /** What it does, in a few words, for the generated cover. */
  coverLine?: string;
}

/**
 * Sorts newest first.
 *
 * `timeframe` is display text ("Feb 2026", "Oct — Nov 2025", "Jul — Aug 2026"),
 * never a date, so it is parsed rather than compared: take the *last* month
 * named, which for a range is when the work stopped. Anything unparseable
 * sorts last rather than throwing — a bad timeframe should cost an entry its
 * position, not the page.
 */
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function endedAt(timeframe: string): number {
  const year = timeframe.match(/\b(20\d{2})\b/)?.[1];
  if (!year) return 0;
  const months = [...timeframe.toLowerCase().matchAll(/\b([a-z]{3})[a-z]*\b/g)]
    .map((m) => MONTHS.indexOf(m[1]))
    .filter((i) => i >= 0);
  const month = months.length ? months[months.length - 1] : 0;
  return Number(year) * 12 + month;
}

/** Every project with a written record, newest first. */
export function catalog(): CatalogEntry[] {
  const featuredSlugs = new Set(projects.slice(0, 4).map((p) => p.slug));

  const fromProjects: CatalogEntry[] = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    category: p.category,
    stack: p.stack,
    timeframe: p.timeframe,
    href: `/work/${p.slug}`,
    repoUrl: p.repoUrl,
    liveUrl: p.liveUrl,
    media: p.media,
    terminal: p.terminal,
    featured: featuredSlugs.has(p.slug),
    highlights: p.caseStudy.map((s) => s.heading),
  }));

  const fromRepos: CatalogEntry[] = repos.map(repoEntry);

  return [...fromProjects, ...fromRepos].sort(
    (a, b) => endedAt(b.timeframe) - endedAt(a.timeframe),
  );
}

function repoEntry(r: (typeof repos)[number]): CatalogEntry {
  const note = repoNotes[r.slug];
  return {
    slug: r.slug,
    title: r.title,
    summary: note?.blurb ?? r.summary,
    category: r.category,
    stack: r.stack,
    timeframe: r.timeframe,
    href: `/projects/${r.slug}`,
    repoUrl: r.repoUrl,
    liveUrl: r.liveUrl,
    featured: false,
    highlights: note?.highlights ?? r.highlights,
    coverTitle: note?.coverTitle,
    coverLine: note?.coverLine,
  };
}

/** One repository, for `/projects/[slug]`. Case studies are served by `/work`. */
export function getRepoEntry(slug: string): CatalogEntry | undefined {
  const repo = repos.find((r) => r.slug === slug);
  return repo ? repoEntry(repo) : undefined;
}
