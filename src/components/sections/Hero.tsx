import Image from "next/image";
import Link from "next/link";
import { profile } from "@/content/profile";

/**
 * Above the fold. Split copy-and-image: the positioning line stays hard-left
 * where the F-pattern scan catches it, and the portrait is locked to a 4:5
 * ratio so it can never stretch.
 *
 * Nothing personal, no hobbies — the only pointer is the "Beyond" nav item.
 */
export function Hero() {
  return (
    <section className="hero wrap">
      <div className="hero-grid">
        <div className="hero-copy">
          <h1>{profile.name}</h1>
          <p className="positioning">{profile.positioning}</p>
          <p className="hero-loc">{profile.location}</p>

          <div className="cta-row">
            <Link className="btn btn-primary" href="/#experience">
              Explore my work ↓
            </Link>
            <Link className="btn btn-ghost" href="/resume">
              Résumé
            </Link>
          </div>
        </div>

        <div className="portrait">
          {/* The only image on the page with `priority` — it is the LCP element. */}
          <Image
            src={profile.photo}
            alt={`${profile.name}, ${profile.role}`}
            width={760}
            height={950}
            priority
            sizes="(max-width: 900px) 300px, 380px"
          />
        </div>
      </div>
    </section>
  );
}
