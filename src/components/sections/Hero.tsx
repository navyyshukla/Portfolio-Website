import Link from "next/link";
import { profile } from "@/content/profile";

/**
 * Above the fold. Holds exactly three things: the name, the one-line
 * positioning statement, and two CTAs.
 *
 * Nothing personal, no hobbies, no animation gate, no mode toggle. A recruiter
 * must be able to answer "what does this person do, and with what" without
 * scrolling or clicking.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-16 pt-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {profile.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg">
        {profile.positioning}
      </p>
      <p className="mt-2 text-sm text-muted">{profile.location}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="#work"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
        >
          See selected work
        </Link>
        <a
          href={`mailto:${profile.email}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
        >
          Get in touch
        </a>
      </div>
    </section>
  );
}
