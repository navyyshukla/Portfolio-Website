"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Site-wide interactive dot field.
 *
 * THE BUG THAT MADE THIS COVER ~2% OF THE SCREEN
 * ----------------------------------------------
 * `<canvas>` is a *replaced element*. `position: fixed; inset: 0` does NOT
 * stretch a replaced element — with `width`/`height` left at `auto` the browser
 * falls back to the intrinsic size, which for a canvas defaults to 300x150.
 * On a ~2000x1200 viewport that is 1.9% of the page, pinned top-left, which is
 * exactly what was on screen. `inset: 0` looked like it should work and never
 * did. The canvas now carries explicit `width: 100%; height: 100%` in CSS.
 *
 * WHAT IT DOES NOW
 * ----------------
 *  - a full-viewport grid of dots, painted above the page so no opaque card
 *    can hide it;
 *  - a soft accent spotlight that follows the cursor;
 *  - dots near the cursor grow, brighten and are pushed outward, easing back
 *    when it leaves;
 *  - clicking sends a ripple ring outward that displaces dots as it passes.
 *
 * Constraints from CLAUDE.md: hand-written Canvas 2D, no animation library,
 * pauses when the tab is hidden, static under reduced motion.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();
  // The résumé is a document to be read — texture over it hurts legibility.
  const suppressed = pathname === "/resume";

  useEffect(() => {
    if (suppressed) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let step = 26;
    let tick = 0;
    let raf: number | null = null;

    let targetX = -9999;
    let targetY = -9999;
    let easeX = -9999;
    let easeY = -9999;

    /** Expanding rings from clicks. */
    const ripples: { x: number; y: number; r: number }[] = [];

    const token = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const accent = token("--accent", "#ffb072");
      const base = token("--dot", "#9dafcc");
      const radius = Math.min(260, Math.max(170, w * 0.14));
      const onScreen = easeX > -9000;

      // Soft spotlight under the cursor — this is what makes the effect read
      // instantly rather than being a texture you have to hunt for.
      if (onScreen) {
        const g = ctx.createRadialGradient(easeX, easeY, 0, easeX, easeY, radius * 1.25);
        g.addColorStop(0, accent);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = g;
        ctx.fillRect(easeX - radius * 1.3, easeY - radius * 1.3, radius * 2.6, radius * 2.6);
        ctx.globalAlpha = 1;
      }

      for (let y = step * 0.5; y < h + step; y += step) {
        for (let x = step * 0.5; x < w + step; x += step) {
          let ox = 0;
          let oy = 0;
          let f = 0;

          if (onScreen) {
            const dx = x - easeX;
            const dy = y - easeY;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < radius) {
              f = 1 - dist / radius;
              f *= f;
              // push outward, strongest close in
              ox = (dx / dist) * f * 12;
              oy = (dy / dist) * f * 12;
            }
          }

          // Ripples shove dots as the ring passes over them.
          for (const rip of ripples) {
            const dx = x - rip.x;
            const dy = y - rip.y;
            const dist = Math.hypot(dx, dy) || 1;
            const band = Math.abs(dist - rip.r);
            if (band < 60) {
              const strength = (1 - band / 60) * (1 - rip.r / (Math.max(w, h) * 0.9));
              if (strength > 0) {
                ox += (dx / dist) * strength * 16;
                oy += (dy / dist) * strength * 16;
                f = Math.max(f, strength * 0.75);
              }
            }
          }

          const drift = reduced ? 0 : Math.sin(tick / 55 + x / 110 + y / 85) * 0.9;

          ctx.fillStyle = f > 0.3 ? accent : base;
          ctx.globalAlpha = 0.18 + f * 0.75;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy + drift, 1 + f * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      // Now that the CSS gives the canvas a real box, its own rect is correct.
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      // Thin the grid on small screens so phones do not draw thousands of dots.
      step = w < 700 ? 34 : 26;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const loop = () => {
      tick += 1;
      easeX += (targetX - easeX) * 0.18;
      easeY += (targetY - easeY) * 0.18;
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        ripples[i].r += 13;
        if (ripples[i].r > Math.max(w, h)) ripples.splice(i, 1);
      }
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
      targetX = e.clientX;
      targetY = e.clientY;
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
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 0 });
      if (ripples.length > 4) ripples.shift();
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    if (!reduced) start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [suppressed]);

  if (suppressed) return null;
  return <canvas id="field" ref={ref} aria-hidden="true" />;
}
