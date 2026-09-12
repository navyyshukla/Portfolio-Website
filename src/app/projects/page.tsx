import Link from "next/link";
import type { Metadata } from "next";
import { projectsPage } from "@/content/projects";
import { catalog } from "@/lib/catalog";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import TerminalFrame from "@/components/ui/TerminalFrame";
import ProjectCover from "@/components/ui/ProjectCover";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: projectsPage.title,
  description: projectsPage.intro,
  path: "/projects",
});

/**
 * The full catalogue.
 *
 * "/" carries four projects because a recruiter scanning it should reach the
 * contact details without wading. Everything else lives here — including those
 * four, since a page called "All projects" that omits the best ones is a lie.
 * Featured entries link across to their case study; the rest to their own page.
 *
 * No preview is ever missing: a screenshot where one was captured, the
 * project's own output where it is a command-line tool, and a generated cover
 * otherwise.
 */
export default function ProjectsPage() {
  const entries = catalog();

  return (
    <div className="wrap" style={{ paddingBlock: "clamp(3rem, 7vw, 5rem)" }}>
      <Link href="/" className="eyebrow">
        {projectsPage.backLabel}
      </Link>
      <p
        className="eyebrow eyebrow--accent"
        style={{ marginTop: "1.5rem" }}
      >
        {projectsPage.eyebrow}
      </p>
      <h1 style={{ fontSize: "var(--t-h2)", margin: "0.5rem 0 0" }}>
        {projectsPage.title}
      </h1>
      <p className="positioning">{projectsPage.intro}</p>

      <ul className="project-grid" style={{ marginTop: "clamp(2rem, 5vw, 3rem)" }}>
        {entries.map((entry) => (
          <li key={entry.href} style={{ display: "flex" }}>
            <Link href={entry.href} className="project-card reveal">
              <div className="shot">
                {entry.media ? (
                  /* Lazy by default — `priority` belongs to the hero on "/",
                     and this grid is ten posters below the fold. */
                  <BrowserFrame
                    media={entry.media}
                    sizes="(max-width: 800px) 92vw, 560px"
                  />
                ) : entry.terminal ? (
                  <TerminalFrame terminal={entry.terminal} />
                ) : (
                  <ProjectCover
                    slug={entry.slug}
                    title={entry.title}
                    category={entry.category}
                    stack={entry.stack}
                    coverTitle={entry.coverTitle}
                    coverLine={entry.coverLine}
                    art={entry.art}
                  />
                )}
              </div>
              <div className="body">
                <p className="eyebrow eyebrow--accent">
                  {entry.category} · {entry.timeframe}
                </p>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <p className="stackline">{entry.stack.join(" · ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
