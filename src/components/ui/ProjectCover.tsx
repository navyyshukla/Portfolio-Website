/**
 * A generated cover for a project with nothing to screenshot.
 *
 * Most of these repositories were never deployed, so there is no screen to
 * capture — and `capture-shots.mjs` only knows how to photograph a live URL.
 * The alternatives were a stock illustration (says nothing, and is somebody
 * else's) or an empty card (reads as missing rather than intended).
 *
 * So the cover is drawn from the slug. A hash picks one of four patterns and a
 * hue offset, which makes each project's cover unique, stable across rebuilds,
 * and impossible to 404. Everything is inline SVG over CSS custom properties:
 * **zero JavaScript, zero image bytes**, and it re-themes with the site because
 * the colours are the site's own tokens rather than baked-in hex.
 *
 * The hue offsets stay inside a warm band on purpose. The accent is orange in
 * both themes; a full 360° spread would give the catalogue a rainbow of cards
 * belonging to no particular site.
 */

import type { JSX } from "react";

/** FNV-1a. Small, dependency-free, and stable across builds — which is the point. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Warm offsets only. See the note above about rainbows. */
const HUES = [-34, -21, -9, 0, 13, 28, 46];

/**
 * The name to draw on the cover.
 *
 * Initials were the first attempt and they were useless: "TP" and "RV" tell a
 * visitor nothing, and the card already prints the real title directly below.
 * So the cover carries a readable name instead — the curated `coverTitle` from
 * `repo-notes.ts` where one is set, otherwise the title with any trailing
 * explanation dropped, since "AGROBOT: Automated Seed Sowing Robot" is a
 * sentence and "AGROBOT" is a name.
 */
function coverName(title: string, override?: string): string {
  if (override) return override;
  // "AGROBOT: Automated Seed Sowing Robot" → "AGROBOT"
  const beforeColon = title.split(":")[0].trim();
  // "Handwritten Digit Recognition using a CNN" → "Handwritten Digit Recognition"
  return beforeColon.split(/\s+(?:using|with|for|built)\s+/i)[0].trim();
}

/**
 * The four patterns, drawn in a 1440×900 box to match the poster aspect exactly
 * — a catalogue row mixing screenshots and covers must not change height.
 *
 * `seed` shifts the geometry within a pattern so two projects landing on the
 * same variant still differ. All four use `currentColor`, so the caller sets
 * the colour once on the <svg>.
 */
function pattern(variant: number, seed: number): JSX.Element {
  switch (variant) {
    // Dot grid — the site's own dot-field motif, at rest.
    case 0: {
      const cols = 18;
      const rows = 11;
      const dots = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // A soft diagonal falloff, offset by the seed, so the field fades
          // rather than sitting as a flat screen of identical dots.
          const t = (x + y + (seed % 9)) / (cols + rows);
          dots.push(
            <circle
              key={`${x}-${y}`}
              cx={60 + x * 76}
              cy={60 + y * 76}
              r={2 + (1 - t) * 7}
              opacity={0.12 + (1 - t) * 0.5}
            />,
          );
        }
      }
      return <g fill="currentColor">{dots}</g>;
    }

    // Concentric arcs radiating from a seeded corner.
    case 1: {
      const cx = seed % 2 ? 1240 : 200;
      const cy = seed % 3 ? 760 : 140;
      return (
        <g fill="none" stroke="currentColor" strokeWidth={3}>
          {Array.from({ length: 11 }, (_, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={110 + i * 118}
              opacity={0.5 - i * 0.035}
            />
          ))}
        </g>
      );
    }

    // Diagonal rules, thickening across the field.
    case 2: {
      const lean = seed % 2 ? 1 : -1;
      return (
        <g stroke="currentColor" strokeLinecap="round">
          {Array.from({ length: 26 }, (_, i) => {
            const x = -300 + i * 88;
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x + lean * 420}
                y2={900}
                strokeWidth={1 + (i % 5) * 1.7}
                opacity={0.1 + (i % 7) * 0.055}
              />
            );
          })}
        </g>
      );
    }

    // Nested squares, rotated off-axis.
    default: {
      const angle = 8 + (seed % 5) * 7;
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          transform={`rotate(${angle} 720 450)`}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const size = 120 + i * 108;
            return (
              <rect
                key={i}
                x={720 - size / 2}
                y={450 - size / 2}
                width={size}
                height={size}
                rx={18}
                opacity={0.46 - i * 0.04}
              />
            );
          })}
        </g>
      );
    }
  }
}

export default function ProjectCover({
  slug,
  title,
  category,
  stack,
  coverTitle,
  coverLine,
  banner = false,
}: {
  slug: string;
  title: string;
  category: string;
  stack: string[];
  /** A shorter name for the cover, where the full title is a sentence. */
  coverTitle?: string;
  /** What the project does, in a few words. Falls back to category · language. */
  coverLine?: string;
  /** Short and wide, for the top of a page where the cover is not the subject. */
  banner?: boolean;
}) {
  const h = hash(slug);
  const variant = h % 4;
  const hue = HUES[(h >>> 3) % HUES.length];

  return (
    <div
      className={`pcover${banner ? " pcover--banner" : ""}`}
      style={{ "--cover-hue": `${hue}deg` } as React.CSSProperties}
      role="img"
      aria-label={`${title} — generated cover`}
    >
      <svg
        className="pcover-art"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        {pattern(variant, h)}
      </svg>
      <div className="pcover-label" aria-hidden="true">
        <span className="pcover-name">{coverName(title, coverTitle)}</span>
        <span className="pcover-meta">
          {coverLine ?? [category, stack[0]].filter(Boolean).join(" · ")}
        </span>
      </div>
    </div>
  );
}
