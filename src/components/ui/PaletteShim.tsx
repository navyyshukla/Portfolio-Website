"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * The entire site-wide cost of the ⌘K palette.
 *
 * This is the ONE piece of assistant-adjacent code allowed in the `/` bundle,
 * and it is capped at 2 KB by CLAUDE.md. It registers a single keydown listener
 * and nothing else; cmdk, the palette, the chat UI and the corpus all stay out
 * of `/` until the user actually presses the shortcut.
 *
 * A literal 0 KB is impossible for a site-wide hotkey — that trade-off is
 * recorded in report §3.4.6 rather than papered over.
 */

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

export function PaletteShim() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;
  return <CommandPalette onClose={() => setOpen(false)} />;
}
