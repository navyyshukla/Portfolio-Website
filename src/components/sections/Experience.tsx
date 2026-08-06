import { experience, education } from "@/content/experience";

/**
 * One continuous track record: a single rail with a marker per entry, jobs and
 * education in the same timeline rather than separate boxed lists.
 */
export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="section wrap">
      <div className="section-head reveal">
        <p className="eyebrow">01 — Track record</p>
        <h2 id="experience-heading">Experience</h2>
      </div>

      <ul className="roles">
        {experience.map((item) => (
          <li
            key={`${item.organisation}-${item.role}`}
            className={`role reveal${item.current ? " role--now" : ""}`}
          >
            <div className="role-top">
              <span className="role-when">{item.timeframe}</span>
              {item.location ? <span className="role-when">{item.location}</span> : null}
              {item.current ? <span className="now-chip">Now</span> : null}
            </div>
            <h3 className="role-title">
              {item.role} <span className="role-org">· {item.organisation}</span>
            </h3>
            <ul className="role-bullets">
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <ul className="role-tech">
              {item.stack.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </li>
        ))}

        {education.map((item) => (
          <li key={item.institution} className="role reveal">
            <div className="role-top">
              <span className="role-when">{item.timeframe}</span>
              {item.detail ? <span className="role-when">{item.detail}</span> : null}
            </div>
            <h3 className="role-title">
              {item.qualification} <span className="role-org">· {item.institution}</span>
            </h3>
          </li>
        ))}
      </ul>
    </section>
  );
}
