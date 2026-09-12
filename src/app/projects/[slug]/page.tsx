import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { repos } from "@/content/repos";
import { projectsPage } from "@/content/projects";
import { getRepoEntry } from "@/lib/catalog";
import ProjectCover from "@/components/ui/ProjectCover";
import { buildMetadata } from "@/lib/seo";

/** Enumerates the full URL space at build time. */
export function generateStaticParams() {
  return repos.map((r) => ({ slug: r.slug }));
}

/** Anything not in the build-time list 404s instead of rendering on demand. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getRepoEntry(slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.title,
    description: entry.summary,
    path: `/projects/${entry.slug}`,
  });
}

/**
 * A repository's own page.
 *
 * Same grammar as a case study at /work/[slug] — eyebrow, title, summary,
 * stack, then the detail — so the catalogue does not feel like it drops you
 * somewhere lesser. What differs is honest rather than cosmetic: there is no
 * deployment to link, so the source link carries the page, and the body is the
 * curated notes from `repo-notes.ts` rather than a written case study.
 */
export default async function RepoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getRepoEntry(slug);
  if (!entry) notFound();

  return (
    <article className="wrap" style={{ paddingBlock: "clamp(3rem, 7vw, 5rem)" }}>
      <Link href="/projects" className="eyebrow">
        ← {projectsPage.title}
      </Link>

      <p className="eyebrow eyebrow--accent" style={{ marginTop: "1.5rem" }}>
        {entry.category} · {entry.timeframe}
      </p>
      <h1 style={{ fontSize: "var(--t-h2)", margin: "0.5rem 0 0" }}>
        {entry.title}
      </h1>
      <p className="positioning">{entry.summary}</p>
      <p className="stackline">{entry.stack.join(" · ")}</p>

      <p className="cta-row">
        {entry.liveUrl ? (
          <a className="btn btn-primary" href={entry.liveUrl}>
            {projectsPage.liveLabel}
          </a>
        ) : null}
        {entry.repoUrl ? (
          <a
            className={`btn ${entry.liveUrl ? "btn-ghost" : "btn-primary"}`}
            href={entry.repoUrl}
          >
            {projectsPage.sourceLabel}
          </a>
        ) : null}
      </p>

      <div style={{ marginTop: "clamp(1.5rem, 4vw, 2.5rem)" }}>
        <ProjectCover
          slug={entry.slug}
          title={entry.title}
          category={entry.category}
          stack={entry.stack}
          coverTitle={entry.coverTitle}
          coverLine={entry.coverLine}
          banner
        />
      </div>

      {entry.highlights.length ? (
        <div
          style={{
            display: "grid",
            gap: "1.4rem",
            marginTop: "clamp(2rem, 5vw, 3rem)",
          }}
        >
          <p className="eyebrow">Notes</p>
          {entry.highlights.map((h) => (
            <p
              key={h}
              style={{ maxWidth: "var(--measure)", color: "var(--fg-dim)", margin: 0 }}
            >
              {h}
            </p>
          ))}
        </div>
      ) : null}

      {!entry.liveUrl ? (
        <p
          className="eyebrow"
          style={{ marginTop: "clamp(2rem, 5vw, 3rem)" }}
        >
          {projectsPage.noDeploy}
        </p>
      ) : null}
    </article>
  );
}
