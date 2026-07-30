import type { Metadata } from "next";
import { beyond } from "@/content/beyond";
import { profile } from "@/content/profile";
import { GameLauncher } from "@/components/game/GameLauncher";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Beyond code",
  description: beyond.intro,
  path: "/beyond-code",
});

/**
 * Everything that is not the job search.
 *
 * This page exists so that personality is present and findable without
 * diluting the recruiter path at "/". The game lives here as a named,
 * lazy-loaded item — discoverable, entirely optional, and zero cost until
 * someone asks for it.
 */
export default function BeyondCodePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-16">
      <h1 className="text-3xl font-semibold tracking-tight">Beyond code</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        {beyond.intro}
      </p>

      <nav aria-label="On this page" className="mt-6">
        <ul className="flex flex-wrap gap-4 text-sm text-muted">
          <li>
            <a href="#about" className="hover:text-fg">
              About
            </a>
          </li>
          <li>
            <a href="#interests" className="hover:text-fg">
              Interests
            </a>
          </li>
          <li>
            <a href="#game" className="hover:text-fg">
              Game
            </a>
          </li>
        </ul>
      </nav>

      <section id="about" aria-labelledby="about-heading" className="mt-12">
        <h2
          id="about-heading"
          className="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          About
        </h2>
        <p className="mt-4 leading-relaxed">{profile.bio}</p>
      </section>

      <section
        id="interests"
        aria-labelledby="interests-heading"
        className="mt-12"
      >
        <h2
          id="interests-heading"
          className="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Interests
        </h2>
        <ul className="mt-6 space-y-6">
          {beyond.entries.map((entry) => (
            <li
              key={entry.title}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {entry.kind}
              </p>
              <h3 className="mt-2 font-semibold">{entry.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {entry.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="game" aria-labelledby="game-heading" className="mt-12">
        <h2
          id="game-heading"
          className="text-sm font-semibold uppercase tracking-widest text-muted"
        >
          Game
        </h2>
        <h3 className="mt-4 font-semibold">{beyond.game.title}</h3>
        <p className="mt-2 leading-relaxed text-muted">
          {beyond.game.blurb}
        </p>
        <GameLauncher />
      </section>
    </div>
  );
}
