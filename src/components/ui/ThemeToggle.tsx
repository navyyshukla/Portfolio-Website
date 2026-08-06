"use client";

import { useSyncExternalStore } from "react";
import { ui } from "@/content/ui";

type Theme = "light" | "dark";

/** Fired on our own toggle, so the snapshot below re-reads the DOM. */
const CHANGED = "themechange";

/**
 * The theme lives in the DOM (`data-theme` on <html>) and in the OS preference,
 * not in React state — the inline script in layout.tsx sets it before React
 * exists. So it is read as an external store rather than mirrored into state,
 * which also keeps the OS preference live for anyone who has not chosen.
 */
function subscribe(onChange: () => void): () => void {
  const os = window.matchMedia("(prefers-color-scheme: dark)");
  os.addEventListener("change", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    os.removeEventListener("change", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function readTheme(): Theme {
  const stamped = document.documentElement.dataset.theme;
  if (stamped === "light" || stamped === "dark") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** The server cannot know the choice; the icon appears on hydration. */
const readOnServer = (): Theme | null => null;

/**
 * Light/dark switch. A leaf component — the nav around it stays a server
 * component with no JS.
 *
 * The site followed the OS preference and had no way to override it. This adds
 * the override without touching a single colour: the palettes in globals.css
 * are unchanged, and an explicit choice is expressed as `data-theme` on <html>,
 * which outranks the `prefers-color-scheme` block.
 *
 * Until the visitor picks something, nothing is stored and the OS keeps
 * deciding — including if they change it mid-session.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, readOnServer);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or storage disabled — the switch still works for this
      // page view, it just will not be remembered. Not worth surfacing.
    }
    window.dispatchEvent(new Event(CHANGED));
  };

  // Render the frame immediately but the icon only once the theme is known, so
  // the nav does not reflow on hydration and no wrong icon flashes first.
  const label = theme === "dark" ? ui.theme.toLight : ui.theme.toDark;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme ? label : ui.theme.generic}
      title={theme ? label : undefined}
    >
      {theme === "dark" ? <SunIcon /> : theme === "light" ? <MoonIcon /> : null}
    </button>
  );
}

/* 24x24, stroke-based, 2px round caps — matching the icons already hand-written
   in ResumeViewer and Assistant. No icon library. */

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M6.5 6.5 4.9 4.9M19.1 19.1l-1.6-1.6M17.5 6.5l1.6-1.6M4.9 19.1l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z" />
    </svg>
  );
}
