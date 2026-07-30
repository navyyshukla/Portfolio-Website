"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Floating entry point to the assistant — a glowing orb, not a chat bubble.
 * Deliberately not in the header: it fades in only once the hero is behind you,
 * so it never competes with the positioning line.
 */
export function AskFab() {
  const [visible, setVisible] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(!entries[0].isIntersecting),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-[70vh] h-px w-px" />
      <Link
        href="/ask"
        className={`ask-fab${visible ? " is-in" : ""}`}
        aria-label="Ask the assistant about my work"
      >
        <span className="halo" aria-hidden="true" />
        <span className="pulse" aria-hidden="true" />
        <span className="orb" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.2l1.7 4.9a4 4 0 0 0 2.5 2.5l4.9 1.7-4.9 1.7a4 4 0 0 0-2.5 2.5L12 20.4l-1.7-4.9a4 4 0 0 0-2.5-2.5L2.9 11.3l4.9-1.7a4 4 0 0 0 2.5-2.5z" />
            <path d="M18.6 2.1l.72 2.06 2.06.72-2.06.72-.72 2.06-.72-2.06-2.06-.72 2.06-.72z" opacity=".85" />
          </svg>
        </span>
        <span className="lbl">Ask about my work</span>
      </Link>
    </>
  );
}
