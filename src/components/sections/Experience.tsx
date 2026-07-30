import { experience, education } from "@/content/experience";

export function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="mx-auto max-w-3xl px-5 py-12"
    >
      <h2
        id="experience-heading"
        className="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Experience
      </h2>
      <ol className="mt-6 space-y-8">
        {experience.map((item) => (
          <li key={`${item.organisation}-${item.role}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-semibold">
                {item.role}
                <span className="font-normal text-muted">
                  {" "}
                  · {item.organisation}
                </span>
              </h3>
              <span className="shrink-0 text-xs text-muted">
                {item.timeframe}
              </span>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-widest text-muted">
        Education
      </h2>
      <ol className="mt-6 space-y-4">
        {education.map((item) => (
          <li
            key={item.institution}
            className="flex items-baseline justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold">{item.qualification}</h3>
              <p className="text-sm text-muted">{item.institution}</p>
              {item.detail ? (
                <p className="text-sm text-muted">{item.detail}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted">
              {item.timeframe}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
