import Link from "next/link";
import { featuredProjects } from "@/content/projects";

/**
 * Exactly three cards. Depth belongs on /work/[slug] — signal-to-noise on a
 * portfolio homepage drops sharply after the third project.
 */
export function SelectedWork() {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="mx-auto max-w-3xl px-5 py-12"
    >
      <h2 id="work-heading" className="text-sm font-semibold uppercase tracking-widest text-muted">
        Selected work
      </h2>
      <ul className="mt-6 space-y-4">
        {featuredProjects.map((project) => (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              className="block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold">{project.title}</h3>
                <span className="shrink-0 text-xs text-muted">
                  {project.timeframe}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {project.summary}
              </p>
              <p className="mt-3 font-mono text-xs text-muted">
                {project.stack.join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
