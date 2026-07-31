"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * The assistant's entry point: a glowing orb that toggles a docked panel.
 *
 * The panel itself (and react-markdown with it) is lazy — nothing loads until
 * the orb is pressed, so the homepage bundle is unaffected.
 */
const ChatPopup = dynamic(
  () => import("@/components/ask/ChatPopup").then((m) => m.ChatPopup),
  { ssr: false },
);

export function Assistant() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
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

      {open ? <ChatPopup onClose={() => setOpen(false)} /> : null}

      <button
        type="button"
        className={`ask-fab${visible || open ? " is-in" : ""}${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close the assistant" : "Ask the assistant about my work"}
      >
        <span className="halo" aria-hidden="true" />
        {!open ? <span className="pulse" aria-hidden="true" /> : null}
        <span className="orb" aria-hidden="true">
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.2l1.7 4.9a4 4 0 0 0 2.5 2.5l4.9 1.7-4.9 1.7a4 4 0 0 0-2.5 2.5L12 20.4l-1.7-4.9a4 4 0 0 0-2.5-2.5L2.9 11.3l4.9-1.7a4 4 0 0 0 2.5-2.5z" />
              <path d="M18.6 2.1l.72 2.06 2.06.72-2.06.72-.72 2.06-.72-2.06-2.06-.72 2.06-.72z" opacity=".85" />
            </svg>
          )}
        </span>
        {!open ? <span className="lbl">Ask about my work</span> : null}
      </button>
    </>
  );
}
