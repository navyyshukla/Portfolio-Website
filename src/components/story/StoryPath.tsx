"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { beyond } from "@/content/beyond";
import { createScene, type SceneHandle } from "./scene";

/**
 * The life-story path — an isometric 3D walk through milestones, not a game.
 *
 * Clash-of-Clans-flavoured: low-poly, orthographic camera, warm palette, a hut
 * per stage. The boy walks between stages and grows as the years pass, and each
 * milestone is shown on a card in the scene beside him.
 *
 * Three.js is ~300 KB and cannot tree-shake meaningfully, so this module is
 * only ever reached through next/dynamic from StoryLauncher, on /beyond-code.
 * It must never be imported from anything on "/".
 *
 * Rules it keeps: never auto-plays, keyboard-operable, and under reduced motion
 * the boy jumps between stages instead of walking.
 */

const STAGES = beyond.story.stages;
const noopSubscribe = () => () => {};
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function StoryPath() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);

  const reduced = useSyncExternalStore(noopSubscribe, prefersReduced, () => false);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf: number | null = null;
    let last = performance.now();
    let disposed = false;

    const handle = createScene(canvas, STAGES, prefersReduced());
    sceneRef.current = handle;
    setReady(true);

    const loop = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      handle.frame(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => handle.resize();
    const onFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.setTimeout(onResize, 80);
    };
    const onVisibility = () => {
      if (document.hidden && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && raf === null) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      handle.dispose();
      sceneRef.current = null;
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(STAGES.length - 1, next));
      sceneRef.current?.goTo(clamped, false);
      setIndex(clamped);
    },
    [],
  );

  // Arrow keys walk the path.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
    };
    const node = shellRef.current;
    node?.addEventListener("keydown", onKey);
    return () => node?.removeEventListener("keydown", onKey);
  }, [go, index]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen?.();
  };

  const stage = STAGES[index];

  return (
    <div className="story-shell" ref={shellRef} tabIndex={-1}>
      <div className="story-stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Isometric story path. Stage ${index + 1} of ${STAGES.length}: ${stage.year}, ${stage.title}.`}
        />
        {!ready ? <p className="story-loading">Building the world…</p> : null}
      </div>

      {/* Text mirror of the in-scene card, so the milestone is never
          canvas-only for assistive tech. */}
      <p className="sr-only" aria-live="polite">
        Stage {index + 1} of {STAGES.length}. {stage.year}. {stage.title}.
        {stage.detail ? ` ${stage.detail}` : ""}
      </p>

      <div className="story-bar">
        <span className="story-pos">
          {stage.year} · Stage {String(index + 1).padStart(2, "0")} /{" "}
          {String(STAGES.length).padStart(2, "0")}
        </span>
        <span className="story-ctrls">
          <button
            className="minibtn"
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            ← Back
          </button>
          <button
            className="minibtn minibtn--go"
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === STAGES.length - 1}
          >
            Next →
          </button>
          <button className="minibtn" type="button" onClick={toggleFullscreen}>
            {isFullscreen ? "Exit fullscreen" : "Fullscreen ⛶"}
          </button>
        </span>
      </div>

      {reduced ? <p className="story-note">{beyond.story.reducedMotionNote}</p> : null}
    </div>
  );
}
