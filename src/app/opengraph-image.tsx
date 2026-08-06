import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";
import { skillGroups } from "@/content/skills";

/**
 * The card that renders when the site is pasted into LinkedIn, WhatsApp or
 * Slack. Without it a share is a blank rectangle, which for a portfolio is the
 * one place a first impression is actually free.
 *
 * A metadata file convention, not an API route: there are no dynamic params, so
 * Next renders this once at build time and serves a static PNG. It costs
 * nothing at runtime and does not count against the one-API-route rule.
 *
 * Satori — the renderer behind ImageResponse — supports inline styles and
 * flexbox only. No Tailwind, no className, no CSS custom properties, and every
 * element with more than one child needs an explicit `display: flex`. The
 * palette below is therefore literal values copied from `globals.css`; if the
 * theme changes there, change it here too.
 */

export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** From `globals.css` `:root` — the dark theme, which is the site's default. */
const GROUND = "#070c17";
const SURFACE = "#121c31";
const HAIR = "#26375f";
const FG = "#f4f7fc";
const DIM = "#d6dfee";
const MUTED = "#9dafcc";
const ACCENT = "#ffb072";

/**
 * Four chips, taken from the skills content rather than written here — copy
 * lives in `src/content/**`, including the copy on a social card. The first
 * entries of Languages and Frameworks are the ones a recruiter screens for.
 */
const chips = [
  ...(skillGroups.find((g) => g.label === "Languages")?.items ?? []).slice(0, 2),
  ...(skillGroups.find((g) => g.label === "Frameworks")?.items ?? []).slice(0, 2),
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: GROUND,
          // Stands in for the accent glow the real page gets from its dot field.
          backgroundImage: `radial-gradient(900px 500px at 78% -8%, rgba(255,176,114,0.16), transparent 60%)`,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: ACCENT,
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {profile.location}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -2,
              color: FG,
              lineHeight: 1.05,
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 40,
              color: ACCENT,
              letterSpacing: -0.5,
            }}
          >
            {profile.role}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 27,
              color: DIM,
              lineHeight: 1.45,
              // The positioning line is long; keep the card readable rather
              // than fitting every word.
              maxWidth: 900,
            }}
          >
            {truncate(withoutRolePrefix(profile.positioning), 160)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            paddingTop: 30,
            borderTop: `1px solid ${HAIR}`,
          }}
        >
          {chips.map((tech) => (
            <div
              key={tech}
              style={{
                display: "flex",
                fontSize: 23,
                color: MUTED,
                background: SURFACE,
                border: `1px solid ${HAIR}`,
                borderRadius: 8,
                padding: "10px 20px",
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

/**
 * `positioning` opens by restating the role ("Software Engineer building …"),
 * which is already the line above it on the card. Dropping the repeat also
 * buys back the characters that were pushing the sentence into an ellipsis
 * mid-list.
 */
function withoutRolePrefix(text: string) {
  return text.startsWith(profile.role)
    ? text.slice(profile.role.length).trimStart()
    : text;
}

/** Trims on a word boundary so the card never ends mid-word. */
function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
