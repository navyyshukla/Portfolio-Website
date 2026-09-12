import Link from "next/link";
import { featuredProjects, projectsPage } from "@/content/projects";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { ProjectPreviewVideo } from "@/components/ui/ProjectPreviewVideo";
import TerminalFrame from "@/components/ui/TerminalFrame";
import ProjectCover from "@/components/ui/ProjectCover";

/**
 * Four equal rows, same size and shape — no ranking implied by tile size.
 * Depth belongs on /work/[slug], and the rest of the catalogue on /projects.
 *
 * A row shows whichever preview the project has: a screenshot in browser
 * chrome, its own output in a terminal, or a generated cover. The class name
 * `work-row` is load-bearing on all three — `ProjectPreviewVideo` finds its
 * card with `closest(".work-row")` and every hover rule keys off it.
 */
export function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-heading" className="section wrap">
      <div className="section-head reveal">
        <p className="eyebrow">02 — Selected work</p>
        <h2 id="work-heading">Things I&rsquo;ve built</h2>
      </div>

      <div className="work-list">
        {featuredProjects.map((project) => (
          <Link
            key={project.slug}
            href={`/work/${project.slug}`}
            className="work-row reveal"
          >
            <div className="body">
              <p className="eyebrow eyebrow--accent">
                {project.category} · {project.timeframe}
              </p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <div className="grow" />
              <p className="stackline">{project.stack.join(" · ")}</p>
              <p className="links">
                {project.liveUrl ? <span>Live</span> : null}
                {project.repoUrl ? <span>Code</span> : null}
              </p>
            </div>
            <div className="preview">
              {/* The preview column is the narrower half of a 1.15fr 1fr
                  grid inside a 1240px page, so it never exceeds ~520px. */}
              {project.media ? (
                <BrowserFrame
                  media={project.media}
                  sizes="(max-width: 800px) 92vw, 520px"
                >
                  {project.media.video ? (
                    <ProjectPreviewVideo src={project.media.video} />
                  ) : null}
                </BrowserFrame>
              ) : project.terminal ? (
                <TerminalFrame terminal={project.terminal} />
              ) : (
                <ProjectCover
                  slug={project.slug}
                  title={project.title}
                  category={project.category}
                  stack={project.stack}
                />
              )}
            </div>
          </Link>
        ))}
      </div>

      <p className="work-more reveal">
        <Link href="/projects" className="btn btn-ghost">
          {projectsPage.title} ↗
        </Link>
      </p>
    </section>
  );
}
