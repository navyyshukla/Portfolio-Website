/**
 * Interface copy — labels that belong to controls rather than to content.
 *
 * Here rather than inline in components, per the rule that all user-facing
 * strings live in `src/content/**`. Accessible names count: they are read
 * aloud, so they are copy.
 */

export const ui = {
  theme: {
    /** Names the action, not the current state — what a click will do. */
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
    /** Before the theme is known on first paint. */
    generic: "Switch theme",
  },
} as const;
