"use client";

import { useEffect, useRef } from "react";

/**
 * The site-wide signature: a cursor-reactive dot field behind everything,
 * visible in the page margins.
 *
 * Constraints from CLAUDE.md: hand-written Canvas 2D, no animation library,
 * pauses when the tab is hidden, static single frame under reduced motion.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let tick = 0;
    let px = -9999;
    let py = -9999;
    let raf: number | null = null;

    const token = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const step = 28;
      const radius = 170;
      const accent = token("--accent", "#ffb072");
      const base = token("--dot", "#9dafcc");

      for (let y = step; y < h; y += step) {
        for (let x = step; x < w; x += step) {
          const dx = x - px;
          const dy = y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let f = dist < radius ? 1 - dist / radius : 0;
          f *= f;
          const drift = reduced ? 0 : Math.sin(tick / 50 + x / 105 + y / 82) * 1.05;
          ctx.fillStyle = f > 0.4 ? accent : base;
          ctx.globalAlpha = 0.1 + f * 0.7;
          ctx.beginPath();
          ctx.arc(x - dx * f * 0.14, y + drift - dy * f * 0.14, 0.85 + f * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const loop = () => {
      tick += 1;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf === null && !reduced && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    const onLeave = () => {
      px = -9999;
      py = -9999;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas id="field" ref={ref} aria-hidden="true" />;
}
