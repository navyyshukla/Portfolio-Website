import Link from "next/link";
import { profile } from "@/content/profile";

/**
 * Server component — no client JS. Wordmark in the display serif, links in the
 * sans, so the header does not share the footer's monospace voice.
 */
export function SiteNav() {
  return (
    <header className="nav">
      <div className="wrap">
        <Link href="/" className="nav-name">
          {profile.name}
        </Link>
        <nav aria-label="Primary">
          <ul className="nav-links">
            <li className="nav-hide">
              <Link href="/#experience">Experience</Link>
            </li>
            <li>
              <Link href="/#work">Work</Link>
            </li>
            <li className="nav-hide">
              <Link href="/beyond-code">Beyond</Link>
            </li>
            <li>
              <Link href="/#contact">Contact</Link>
            </li>
            <li>
              <a
                href={profile.resumeHref}
                className="is-resume"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Résumé, PDF, opens in a new tab"
              >
                Résumé
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
