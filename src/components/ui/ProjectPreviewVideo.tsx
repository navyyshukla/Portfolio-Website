"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query rather than sampling it once, so toggling
 * reduced motion in the OS takes effect without a reload. The server snapshot
 * is `false`: the server cannot know, and rendering the video only after the
 * client has answered is both correct and the cheaper default.
 */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * A muted clip that plays over the poster while the visitor is looking at the
 * card, and costs nothing until then.
 *
 * The trick is that the `<video>` ships with **no `src`**. A browser will not
 * fetch what it has not been given a URL for, so the clip is zero bytes on
 * first load; the src is attached the first time the pointer or the keyboard
 * reaches the card, and only then does anything download. That is what keeps
 * this affordable on a page with a hard first-load budget.
 *
 * It renders nothing at all when the visitor has asked for reduced motion, or
 * when there is no hover to speak of — on a phone the poster is the right
 * answer, and an autoplaying loop nobody asked for is both a waste of their
 * data and a WCAG 2.2.2 problem.
 */
export function ProjectPreviewVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const canHover = useMediaQuery("(hover: hover)");
  const stillness = useMediaQuery("(prefers-reduced-motion: reduce)");
  const wanted = canHover && !stillness;

  useEffect(() => {
    if (!wanted) return;
    const video = ref.current;
    const card = video?.closest(".work-row");
    if (!video || !card) return;

    const start = () => {
      // First interest: hand it the URL. Every later hover replays what is by
      // then already cached.
      if (!video.src) video.src = src;
      void video.play().then(
        () => setPlaying(true),
        () => setPlaying(false), // Autoplay refused, or the file is missing.
      );
    };

    const stop = () => {
      setPlaying(false);
      video.pause();
    };

    card.addEventListener("pointerenter", start);
    card.addEventListener("focusin", start);
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focusout", stop);
    return () => {
      card.removeEventListener("pointerenter", start);
      card.removeEventListener("focusin", start);
      card.removeEventListener("pointerleave", stop);
      card.removeEventListener("focusout", stop);
    };
  }, [wanted, src]);

  if (!wanted) return null;

  return (
    <video
      ref={ref}
      className="bframe-video"
      data-playing={playing}
      muted
      loop
      playsInline
      preload="none"
      // Decorative: the poster underneath already carries the alt text, and
      // announcing the same thing twice helps nobody.
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
