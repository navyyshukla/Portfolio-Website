import { profile } from "@/content/profile";

/**
 * A mailto link, not a form. A form would be the only untrusted input on the
 * site and would need spam handling and server-side validation for no real
 * gain. Revisit only if there is a concrete reason.
 */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="mx-auto max-w-3xl px-5 py-12"
    >
      <h2
        id="contact-heading"
        className="text-sm font-semibold uppercase tracking-widest text-muted"
      >
        Contact
      </h2>
      <p className="mt-4 text-lg">
        <a href={`mailto:${profile.email}`} className="underline underline-offset-4 hover:text-accent">
          {profile.email}
        </a>
      </p>
      <ul className="mt-4 flex gap-4 text-sm text-muted">
        {profile.socials.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
