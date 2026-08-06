"use client";

import { useEffect } from "react";

/**
 * Lenis smooth scroll (darkroomengineering/lenis).
 *
 * Loaded dynamically so it never enters the "/" first-load bundle. Two things
 * the docs warn about and this handles:
 *
 *  - Lenis lerps the real scroll position, so native `scroll-behavior: smooth`
 *    fights it. That is disabled on <html> while Lenis is active and restored
 *    on unmount.
 *  - Anchor links stop working, because Lenis owns the scroll. In-page hash
 *    links are intercepted and handed to `lenis.scrollTo`.
 *
 * Disabled entirely under reduced motion — hijacking scroll is exactly the
 * kind of motion the preference exists to opt out of.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";

      let raf = 0;
      const frame = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      // Hand in-page anchors back to Lenis.
      const onClick = (event: MouseEvent) => {
        const anchor = (event.target as HTMLElement)?.closest?.("a[href*='#']") as
          | HTMLAnchorElement
          | null;
        if (!anchor) return;
        const url = new URL(anchor.href, window.location.href);
        if (url.pathname !== window.location.pathname) return;
        const target = document.querySelector(url.hash);
        if (!url.hash || !target) return;
        event.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -80 });
      };
      document.addEventListener("click", onClick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("click", onClick);
        document.documentElement.style.scrollBehavior = previousBehavior;
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
