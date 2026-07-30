"use client";

import { useEffect, useRef } from "react";

/**
 * The site-wide signature: a cursor-reactive dot field behind everything,
 * visible in the page margins.
 *
 * Two bugs this fixes, both from the first version:
 *
 * 1. The highlight sat to the RIGHT of the cursor. The canvas was sized from
 *    `window.innerWidth`, which INCLUDES the vertical scrollbar, while a
 *    `position: fixed; inset: 0` element is laid out to the viewport WITHOUT
 *    it. The backing store was therefore wider than the element, the browser
 *    scaled it down horizontally, and every dot drifted right — worse the
 *    further right you went. Now measured from the canvas's own rect.
 *
 * 2. The highlight vanished. `draw()` only ran inside the rAF loop, so under
 *    reduced motion (loop never starts) it never tracked the cursor at all,
 *    and `pointerleave` on `window` fired spuriously. Now the cursor position
 *    is committed every frame, and leave is bound to the document instead.
 *
 * Constraints from CLAUDE.md: hand-written Canvas 2D, no animation library,
 * pauses when the tab is hidden, static under reduced motion.
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
    let raf: number | null = null;

    // Where the pointer actually is, and where the highlight has eased to.
    let targetX = -9999;
    let targetY = -9999;
    let easeX = -9999;
    let easeY = -9999;

    const token = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const step = 24;
      const radius = 190;
      const accent = token("--accent", "#ffb072");
      const base = token("--dot", "#9dafcc");

      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          const dx = x - easeX;
          const dy = y - easeY;
          const dist = Math.hypot(dx, dy);
          let f = dist < radius ? 1 - dist / radius : 0;
          f *= f;
          const drift = reduced ? 0 : Math.sin(tick / 50 + x / 105 + y / 82) * 1.05;
          ctx.fillStyle = f > 0.38 ? accent : base;
          ctx.globalAlpha = 0.16 + f * 0.72;
          ctx.beginPath();
          ctx.arc(x - dx * f * 0.16, y + drift - dy * f * 0.16, 0.9 + f * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      // Measure the ELEMENT, not the window — the window includes the scrollbar.
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const loop = () => {
      tick += 1;
      // Ease toward the cursor so the highlight feels attached, not snapped.
      easeX += (targetX - easeX) * 0.22;
      easeY += (targetY - easeY) * 0.22;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf === null && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      // The canvas is fixed at the viewport origin, so client coords map 1:1
      // — but subtract the rect anyway so it stays correct if that changes.
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      // Jump on the very first move rather than easing in from off-screen.
      if (easeX < -9000) {
        easeX = targetX;
        easeY = targetY;
      }
      if (reduced) draw();
    };
    const onLeave = () => {
      targetX = -9999;
      targetY = -9999;
      if (reduced) {
        easeX = -9999;
        easeY = -9999;
        draw();
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    // Under reduced motion there is no loop; the pointer handler redraws.
    if (!reduced) start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas id="field" ref={ref} aria-hidden="true" />;
}
