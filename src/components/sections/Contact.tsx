import { profile } from "@/content/profile";

/**
 * A mailto and four channels. No form — it would be the only untrusted input on
 * the site and would need spam handling for no real gain.
 */

const ICONS: Record<string, React.ReactNode> = {
  GitHub: (
    <path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9.1 7.6 10.6.6.1.8-.2.8-.6v-2c-3.1.7-3.8-1.5-3.8-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.6 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.3-5.1 5.6.4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6a11.1 11.1 0 0 0 7.6-10.6C23.1 5.3 18.3.5 12 .5z" />
  ),
  LinkedIn: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.3 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3-2.01 0-2.32 1.57-2.32 3.2V21H9z" />
  ),
  Gmail: (
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  ),
  Instagram: (
    <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.4.36 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 3.15A6.65 6.65 0 1 0 18.65 12 6.65 6.65 0 0 0 12 5.35zm0 10.97A4.32 4.32 0 1 1 16.32 12 4.32 4.32 0 0 1 12 16.32zm6.91-11.1a1.55 1.55 0 1 1-1.56-1.56 1.55 1.55 0 0 1 1.56 1.56z" />
  ),
};

function handleFor(href: string) {
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function Contact() {
  const channels = [
    ...profile.socials.filter((s) => s.label !== "Instagram"),
    { label: "Gmail", href: `mailto:${profile.email}` },
    ...profile.socials.filter((s) => s.label === "Instagram"),
  ];

  return (
    <section id="contact" aria-labelledby="contact-heading" className="section wrap">
      <div className="section-head reveal">
        <p className="eyebrow">04 — Get in touch</p>
        <h2 id="contact-heading">Contact</h2>
      </div>

      <div className="reveal">
        <a className="contact-mail" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <p className="contact-note">
          {profile.openTo}. The fastest way to reach me is email — or ask the
          assistant anything about my work.
        </p>
      </div>

      <div className="contact-grid">
        {channels.map((channel) => (
          <a
            key={channel.label}
            className="contact-card reveal"
            href={channel.href}
            target={channel.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={channel.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {ICONS[channel.label]}
            </svg>
            <span className="who">{channel.label}</span>
            <span className="handle">
              {channel.href.startsWith("mailto:")
                ? profile.email
                : handleFor(channel.href)}
            </span>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
