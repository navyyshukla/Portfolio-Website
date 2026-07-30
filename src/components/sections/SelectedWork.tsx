import Link from "next/link";
import { featuredProjects } from "@/content/projects";

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
          <Link key={project.slug} href={`/work/${project.slug}`} className="work-row reveal">
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
                <span>Case study</span>
              </p>
            </div>
            <div className="preview">
              <span className="preview-label">Screenshot / demo</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
