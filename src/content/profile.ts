/**
 * Identity and positioning.
 *
 * `positioning` is the single most important string on the site: it is what a
 * recruiter reads in the first two seconds, and it carries the stack keywords
 * they screen against.
 */

export interface SocialLink {
  label: string;
  href: string;
  /** Short display form — must fit one line in a quarter-width contact card. */
  handle: string;
}

export interface Profile {
  name: string;
  role: string;
  positioning: string;
  /** In his own voice. Used on /beyond-code and by the assistant — not the hero. */
  bio: string;
  location: string;
  email: string;
  /** PDF in /public. */
  resumeHref: string;
  /** Portrait in /public. Replace the file to change the photo; no code change. */
  photo: string;
  openTo: string;
  socials: SocialLink[];
}

export const profile: Profile = {
  name: "Naivedya Shukla",
  role: "Software Engineer",
  positioning:
    "Software Engineer building high-throughput system architectures, resilient APIs, and intelligent AI/ML applications with Python, Next.js, FastAPI and TensorFlow.",
  bio: "An enthusiastic learner who tends to question the things that actually matter, then goes looking for the right way to solve them.",
  location: "Bengaluru, India",
  email: "naivedya9876@gmail.com",
  resumeHref: "/resume.pdf",
  photo: "/photo.png",
  openTo: "Open to software engineering roles",
  socials: [
    { label: "GitHub", href: "https://github.com/navyyshukla", handle: "@navyyshukla" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/naivedyashukla",
      handle: "/naivedyashukla",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/navyyshukla/",
      handle: "@navyyshukla",
    },
  ],
};

/**
 * Absolute site origin — used for canonical URLs, the sitemap and OG images.
 *
 * This is the live production origin, set once the Vercel project existed
 * rather than guessed beforehand. Everything downstream is derived from it:
 * `metadataBase`, every canonical tag, `openGraph.url`, the JSON-LD `url`,
 * every `sitemap.ts` entry and the sitemap line in `robots.ts`. A wrong value
 * breaks nothing at runtime and quietly points search engines at a host we do
 * not control, so it changes only alongside the real domain — and if a custom
 * domain is ever added, this is the one line to update.
 */
export const siteUrl = "https://naivedya-shukla.vercel.app";
