/**
 * Identity and positioning.
 *
 * `positioning` is the single most important string on the site: it is what a
 * recruiter reads in the first two seconds, and it should answer
 * "what do you do, for whom, and with what" — role + domain + stack.
 * Keep it to one sentence and make sure it contains the stack keywords a
 * recruiter would screen against.
 */

export interface SocialLink {
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  /** Short role label, e.g. shown under the name. */
  role: string;
  /** The one-line positioning statement. Role + domain + stack. */
  positioning: string;
  /** 2-4 sentences. Used on /beyond-code, not in the hero. */
  bio: string;
  location: string;
  email: string;
  /** Path to the CV PDF in /public, or an external URL. */
  cvHref: string;
  socials: SocialLink[];
}

export const profile: Profile = {
  // TODO(content): replace every field below.
  name: "TODO: Your Name",
  role: "TODO: e.g. Software Engineer",
  positioning:
    "TODO: One sentence — what you build, for whom, with what stack. This is the first thing a recruiter reads.",
  bio: "TODO: 2-4 sentences in your own voice. This appears on /beyond-code, not in the hero.",
  location: "TODO: City, Country",
  email: "TODO: you@example.com",
  cvHref: "/cv.pdf",
  socials: [
    { label: "GitHub", href: "TODO: https://github.com/..." },
    { label: "LinkedIn", href: "TODO: https://linkedin.com/in/..." },
  ],
};

/** Absolute site origin. Used for canonical URLs, sitemap and OG images. */
export const siteUrl = "https://example.com"; // TODO(content): real domain
