"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { beyond } from "@/content/beyond";

/**
 * Gate in front of the game.
 *
 * The game module is not fetched until the visitor asks for it — so it costs
 * nothing on "/", and nothing on /beyond-code either until this button is
 * pressed. `ssr: false` keeps the canvas code out of the server render.
 */
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => (
    <p className="mt-6 text-sm text-muted">Loading…</p>
  ),
});

export function GameLauncher() {
  const [open, setOpen] = useState(false);

  if (open) return <Game />;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-6 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent"
    >
      Play {beyond.game.title}
    </button>
  );
}
