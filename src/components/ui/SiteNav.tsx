import Link from "next/link";
import { profile } from "@/content/profile";

/**
 * Server component — no client JS. Deliberately plain: the recruiter path must
 * not require any interaction to reveal navigation.
 */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5"
      >
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {profile.name}
        </Link>
        <ul className="flex items-center gap-5 text-sm text-muted">
          <li>
            <Link href="/#work" className="hover:text-fg">
              Work
            </Link>
          </li>
          <li>
            <Link href="/ask" className="hover:text-fg">
              Ask
            </Link>
          </li>
          <li>
            <Link href="/beyond-code" className="hover:text-fg">
              Beyond code
            </Link>
          </li>
          <li>
            <a href={profile.cvHref} className="hover:text-fg">
              CV
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
