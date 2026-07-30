"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { beyond } from "@/content/beyond";

/**
 * The life-story path — a walk through milestones, not a game.
 *
 * This is the 2D mechanics build. The intended final form is isometric 3D in
 * the style of Clash of Clans goblin maps, with each level's achievements shown
 * in-scene beside the character. That needs its own design pass and, because
 *3D means a ~100 KB renderer, it cannot live on "/" — it stays behind this
 * route and this explicit start button.
 *
 * Rules it must keep: never auto-plays, pausable, keyboard-operable, and a
 * static frame under reduced motion.
 */

const STAGES = beyond.story.stages;

const noopSubscribe = () => () => {};
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function StoryPath() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reduced = useSyncExternalStore(noopSubscribe, prefersReduced, () => false);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animation state lives in refs so the rAF loop never re-subscribes.
  const state = useRef({ from: 0, to: 0, progress: 1, bob: 0, live: false, reduced: false });

  // Ref writes belong in an effect, never in the render body.
  useEffect(() => {
    state.current.reduced = reduced;
  }, [reduced]);

  const go = useCallback((next: number) => {
    setIndex((current) => {
      state.current.from = current;
      state.current.to = next;
      state.current.progress = state.current.reduced ? 1 : 0;
      return next;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf: number | null = null;

    const token = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

    const nodeX = (i: number) => {
      const pad = w * 0.11;
      return pad + (w - pad * 2) * (i / Math.max(1, STAGES.length - 1));
    };

    const draw = () => {
      const s = state.current;
      const accent = token("--accent", "#ffb072");
      const dim = token("--dot", "#9dafcc");
      const gy = h * 0.66;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = dim;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodeX(0), gy);
      ctx.lineTo(nodeX(STAGES.length - 1), gy);
      ctx.stroke();

      const here = s.from + (s.to - s.from) * s.progress;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(nodeX(0), gy);
      ctx.lineTo(nodeX(here), gy);
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (let i = 0; i < STAGES.length; i += 1) {
        const x = nodeX(i);
        const reached = i <= Math.round(here);
        ctx.fillStyle = reached ? accent : dim;
        ctx.globalAlpha = reached ? 1 : 0.42;
        ctx.beginPath();
        ctx.arc(x, gy, reached ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        // a marker stays behind at every stage already walked
        if (i < Math.round(here)) {
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x - 3, gy - 20, 6, 12);
        }
      }
      ctx.globalAlpha = 1;

      if (!s.live) return;

      const cx = nodeX(here);
      const grow = 0.55 + (here / Math.max(1, STAGES.length - 1)) * 0.85;
      const bodyH = 30 * grow;
      const headR = 7.5 * grow;
      const walking = s.progress < 1 && !s.reduced;
      const swing = walking ? Math.sin(s.bob / 3.2) : 0;
      const lift = walking ? Math.abs(Math.sin(s.bob / 3.2)) * 3 : 0;
      const baseY = gy - 8 - lift;

      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.lineWidth = Math.max(2, 2.4 * grow);
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx - 7 * grow * (1 + swing * 0.5), baseY + 11 * grow);
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx + 7 * grow * (1 - swing * 0.5), baseY + 11 * grow);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.lineTo(cx, baseY - bodyH * 0.55);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, baseY - bodyH * 0.4);
      ctx.lineTo(cx - 8 * grow * (1 - swing * 0.6), baseY - bodyH * 0.18);
      ctx.moveTo(cx, baseY - bodyH * 0.4);
      ctx.lineTo(cx + 8 * grow * (1 + swing * 0.6), baseY - bodyH * 0.18);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, baseY - bodyH * 0.55 - headR, headR, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      const s = state.current;
      s.bob += 1;
      if (s.progress < 1) s.progress = Math.min(1, s.progress + 0.022);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const onFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.setTimeout(resize, 60);
    };

    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", onFullscreen);
    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  const start = () => {
    state.current.live = true;
    state.current.from = 0;
    state.current.to = 0;
    state.current.progress = 1;
    setStarted(true);
    setIndex(0);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen?.();
  };

  const stage = STAGES[index];

  return (
    <div className="story-shell" ref={shellRef}>
      <div className="story-stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Story path. Stage ${index + 1} of ${STAGES.length}: ${stage.year}, ${stage.title}.`}
        />

        {started ? (
          <div className="story-caption">
            <p className="eyebrow eyebrow--accent">
              Stage {String(index + 1).padStart(2, "0")} · {stage.year}
            </p>
            <h3>{stage.title}</h3>
            {stage.detail ? <p>{stage.detail}</p> : null}
          </div>
        ) : (
          <div className="story-lock">
            <div className="story-lock-inner">
              <h3>{beyond.story.title}</h3>
              <p>{beyond.story.blurb}</p>
              {reduced ? <p className="story-note">{beyond.story.reducedMotionNote}</p> : null}
              <button className="btn btn-primary" type="button" onClick={start}>
                Start the walk
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="story-bar">
        <span className="story-pos">
          {started
            ? `Stage ${String(index + 1).padStart(2, "0")} / ${String(STAGES.length).padStart(2, "0")}`
            : "Not started"}
        </span>
        <span className="story-ctrls">
          <button
            className="minibtn"
            type="button"
            onClick={() => go(index - 1)}
            disabled={!started || index === 0}
          >
            ← Back
          </button>
          <button
            className="minibtn minibtn--go"
            type="button"
            onClick={() => (started ? go(index + 1) : start())}
            disabled={started && index === STAGES.length - 1}
          >
            {started ? "Next →" : "Start"}
          </button>
          <button className="minibtn" type="button" onClick={toggleFullscreen}>
            {isFullscreen ? "Exit fullscreen" : "Fullscreen ⛶"}
          </button>
        </span>
      </div>
    </div>
  );
}
