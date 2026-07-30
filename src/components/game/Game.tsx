"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { beyond } from "@/content/beyond";

/**
 * The game shell.
 *
 * The game CONCEPT is deliberately not decided yet — see the TODO in
 * `drawFrame`/`step` below. What is decided, and must not be regressed, is the
 * envelope around it:
 *
 *   - Never auto-starts. WCAG 2.2 SC 2.2.2.
 *   - Starts paused when `prefers-reduced-motion: reduce` is set, with an
 *     explanation, rather than silently refusing to run. WCAG 2.2 SC 2.3.3.
 *   - Pausable at any time, via button or the Escape / P keys.
 *   - Fully keyboard-operable; the canvas carries a text alternative.
 *   - No audio at all yet. If audio is added it needs an explicit user gesture
 *     and a low default gain. WCAG SC 1.4.2.
 *   - The requestAnimationFrame loop is torn down on unmount and on pause, so
 *     a backgrounded game costs nothing.
 */

const WIDTH = 640;
const HEIGHT = 360;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** `matchMedia` is an external store, so read it as one rather than mirroring
 * it into state from an effect. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Escape and P pause from anywhere while the game is mounted.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        setRunning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render one static frame whether or not the loop is running, so the
    // canvas is never blank and reduced-motion users still see the scene.
    drawFrame(ctx, 0);
    if (!running) return;

    let tick = 0;
    const loop = () => {
      tick += 1;
      drawFrame(ctx, tick);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [running]);

  return (
    <div className="mt-6">
      {prefersReducedMotion && !running ? (
        <p className="mb-4 rounded-md border border-border bg-surface p-4 text-sm text-muted">
          {beyond.game.reducedMotionNote}
        </p>
      ) : null}

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        tabIndex={0}
        role="img"
        aria-label={`${beyond.game.title}. ${beyond.game.blurb}`}
        className="w-full max-w-full rounded-lg border border-border bg-surface"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          aria-pressed={running}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
        >
          {running ? "Pause" : "Play"}
        </button>
        <p className="text-sm text-muted">
          Press <kbd className="font-mono">Esc</kbd> or{" "}
          <kbd className="font-mono">P</kbd> to pause.
        </p>
      </div>
    </div>
  );
}

/**
 * TODO(content): the actual game.
 *
 * Decide the concept during the content pass. Two constraints worth keeping:
 * it should connect to something real about you rather than being a generic
 * arcade clone, and if it ever draws over page content, keep the canvas
 * transparent and push real DOM elements with CSS transforms — flattening page
 * text onto a canvas breaks badly on non-trivial layouts.
 */
function drawFrame(ctx: CanvasRenderingContext2D, tick: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#9aa1ac";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Game placeholder", WIDTH / 2, HEIGHT / 2 - 8);
  ctx.fillText(
    tick === 0 ? "paused" : `running · frame ${tick}`,
    WIDTH / 2,
    HEIGHT / 2 + 14,
  );
}
