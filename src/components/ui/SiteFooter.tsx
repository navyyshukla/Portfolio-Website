import { profile } from "@/content/profile";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <ul className="flex gap-4">
          {profile.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                className="hover:text-fg"
                rel="noopener noreferrer"
                target="_blank"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
