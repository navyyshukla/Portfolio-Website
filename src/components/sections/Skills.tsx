import { skillGroups } from "@/content/skills";

/** Scannable keyword block. No progress bars — nobody believes them. */
export function Skills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="mx-auto max-w-3xl px-5 py-12"
    >
      <h2
        id="skills-heading"
        className="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Skills
      </h2>
      <dl className="mt-6 space-y-4">
        {skillGroups.map((group) => (
          <div key={group.label} className="sm:flex sm:gap-6">
            <dt className="w-32 shrink-0 text-sm font-semibold">
              {group.label}
            </dt>
            <dd className="font-mono text-sm text-muted">
              {group.items.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
