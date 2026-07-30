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
  photo: "/photo.jpg",
  openTo: "Open to software engineering roles",
  socials: [
    { label: "GitHub", href: "https://github.com/navyyshukla" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/naivedyashukla" },
    { label: "Instagram", href: "https://www.instagram.com/navyyshukla/" },
  ],
};

/**
 * Absolute site origin — used for canonical URLs, the sitemap and OG images.
 *
 * TODO: no custom domain yet. Replace this with the real deployment URL (the
 * Vercel one, or a bought domain) before going live — canonical tags and the
 * sitemap point here, so a wrong value quietly harms search indexing.
 */
export const siteUrl = "https://naivedyashukla.vercel.app";
