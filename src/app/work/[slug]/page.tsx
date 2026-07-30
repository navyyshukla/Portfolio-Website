import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, getProject } from "@/content/projects";
import { buildMetadata } from "@/lib/seo";

/** Enumerates the full URL space at build time. */
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/** Anything not in the build-time list 404s instead of rendering on demand. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/work/${project.slug}`,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="wrap" style={{ paddingBlock: "clamp(3rem, 7vw, 5rem)" }}>
      <Link href="/#work" className="eyebrow">
        ← Back to work
      </Link>

      <p className="eyebrow eyebrow--accent" style={{ marginTop: "2rem" }}>
        {project.category} · {project.timeframe}
      </p>
      <h1 style={{ fontSize: "var(--t-h2)", margin: "0.5rem 0 0" }}>{project.title}</h1>
      <p className="positioning">{project.summary}</p>

      <p className="stackline" style={{ marginTop: "2rem" }}>
        {project.stack.join(" · ")}
      </p>

      {(project.liveUrl || project.repoUrl) && (
        <div className="cta-row">
          {project.liveUrl && (
            <a
              className="btn btn-primary"
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live app ↗
            </a>
          )}
          {project.repoUrl && (
            <a
              className="btn btn-ghost"
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source ↗
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: "3rem", display: "grid", gap: "2.5rem" }}>
        {project.caseStudy.map((section) => (
          <section key={section.heading}>
            <p className="eyebrow">{section.heading}</p>
            <div
              style={{
                marginTop: "0.75rem",
                display: "grid",
                gap: "0.85rem",
                maxWidth: "var(--measure)",
                color: "var(--fg-dim)",
              }}
            >
              {section.body.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0 }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
