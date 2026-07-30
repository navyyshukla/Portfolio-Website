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
    <article className="mx-auto max-w-3xl px-5 pb-16 pt-16">
      <Link href="/#work" className="text-sm text-muted hover:text-fg">
        ← Back to work
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {project.title}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        {project.summary}
      </p>

      <dl className="mt-6 grid gap-3 border-y border-border py-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">Timeframe</dt>
          <dd className="mt-1">{project.timeframe}</dd>
        </div>
        <div>
          <dt className="text-muted">Stack</dt>
          <dd className="mt-1 font-mono">
            {project.stack.join(" · ")}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Outcome</dt>
          <dd className="mt-1">{project.outcome}</dd>
        </div>
      </dl>

      {(project.repoUrl || project.liveUrl) && (
        <ul className="mt-5 flex gap-4 text-sm">
          {project.repoUrl && (
            <li>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-accent"
              >
                Source
              </a>
            </li>
          )}
          {project.liveUrl && (
            <li>
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-accent"
              >
                Live
              </a>
            </li>
          )}
        </ul>
      )}

      <div className="mt-10 space-y-8">
        {project.caseStudy.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
