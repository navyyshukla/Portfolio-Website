import { skillGroups } from "@/content/skills";

/** Scannable keyword block for screening. No progress bars. */
export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="section wrap">
      <div className="section-head reveal">
        <p className="eyebrow">03 — Stack</p>
        <h2 id="skills-heading">Skills</h2>
      </div>

      <dl className="skills">
        {skillGroups.map((group) => (
          <div key={group.label} className="skillrow reveal">
            <dt>{group.label}</dt>
            <dd>
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
