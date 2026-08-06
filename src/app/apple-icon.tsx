import { ImageResponse } from "next/og";

/**
 * The icon iOS uses when the site is saved to a home screen. It has to be a
 * PNG — Safari ignores SVG here — so it is generated rather than handed the
 * `icon.svg` next to it. Same mark, same colours; keep the two in step.
 *
 * Rendered once at build time, like `opengraph-image.tsx`.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Literals from `globals.css`; Satori cannot read CSS custom properties. */
const GROUND = "#070c17";
const ACCENT = "#ffb072";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // iOS applies its own rounded mask, so this stays a full-bleed
          // square — no corner radius of our own to double up on.
          background: GROUND,
          color: ACCENT,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        NS
      </div>
    ),
    size,
  );
}
