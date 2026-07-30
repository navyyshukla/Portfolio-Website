import type { Metadata } from "next";
import { beyond } from "@/content/beyond";
import { profile } from "@/content/profile";
import { StoryLauncher } from "@/components/story/StoryLauncher";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Beyond code",
  description: beyond.intro,
  path: "/beyond-code",
});

/**
 * Everything that is not the job search. Exists so personality is present and
 * findable without diluting the recruiter path at "/".
 */
export default function BeyondCodePage() {
  return (
    <div className="wrap" style={{ paddingBlock: "clamp(3rem, 7vw, 5rem)" }}>
      <p className="eyebrow eyebrow--accent">Beyond code</p>
      <h1 style={{ fontSize: "var(--t-h2)", margin: "0.5rem 0 0" }}>
        The rest of it
      </h1>
      <p className="positioning">{beyond.intro}</p>

      <section className="section" style={{ borderTop: "none" }}>
        <div className="section-head">
          <p className="eyebrow">About</p>
        </div>
        <p style={{ maxWidth: "var(--measure)", color: "var(--fg-dim)", margin: 0 }}>
          {profile.bio}
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Interests</p>
        </div>
        <ul className="beyond-list">
          {beyond.entries.map((entry) => (
            <li key={entry.title}>
              <p className="eyebrow">{entry.kind}</p>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="story">
        <div className="section-head">
          <p className="eyebrow">Story</p>
          <h2>My life, as a path</h2>
        </div>
        <StoryLauncher />
      </section>
    </div>
  );
}
