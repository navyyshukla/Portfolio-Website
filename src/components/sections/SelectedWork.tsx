import Link from "next/link";
import { featuredProjects } from "@/content/projects";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { ProjectPreviewVideo } from "@/components/ui/ProjectPreviewVideo";

/**
 * Three equal rows, same size and shape — no ranking implied by tile size.
 * Depth belongs on /work/[slug].
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
            // Nothing captured yet? The row goes full width rather than
            // reserving half of itself for an empty column.
            className={`work-row reveal${project.media ? "" : " work-row--nomedia"}`}
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
            {project.media ? (
              <div className="preview">
                {/* The preview column is the narrower half of a 1.15fr 1fr
                    grid inside a 1240px page, so it never exceeds ~520px. */}
                <BrowserFrame
                  media={project.media}
                  sizes="(max-width: 800px) 92vw, 520px"
                >
                  {project.media.video ? (
                    <ProjectPreviewVideo src={project.media.video} />
                  ) : null}
                </BrowserFrame>
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
