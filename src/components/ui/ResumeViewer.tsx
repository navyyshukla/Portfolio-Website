"use client";

import { useEffect, useState } from "react";

/**
 * Résumé viewer.
 *
 * Uses <iframe>, not <object>. An <object> hands the PDF to a plugin context
 * that does not reliably take wheel events unless it has been clicked first —
 * which is why scrolling only worked from the scrollbar. An iframe gets the
 * browser's own PDF viewer, which scrolls on hover like any normal page.
 *
 * The expand control opens a macOS Quick Look–style overlay: the page behind
 * blurs and dims, and it closes on ✕, on Escape, or by clicking the backdrop.
 */
export function ResumeViewer({ src, name }: { src: string; name: string }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    // Only lock scroll while the overlay owns the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const frame = (
    <iframe
      // No #view / #toolbar params: those override the browser's own viewer
      // chrome. Plain src restores the native zoom / download panel.
      src={src}
      title={`${name} — résumé`}
      className="resume-iframe"
    />
  );

  return (
    <>
      <div className="resume-frame">
        {frame}
        {/* The browser draws its own zoom / download toolbar inside the iframe
            and page scripts cannot add to it — that UI is not reachable from
            here. This sits in the same bottom region instead, as a matching
            icon control. */}
        <button
          type="button"
          className="resume-expand"
          onClick={() => setExpanded(true)}
          aria-label="Expand the résumé to full screen"
          title="Expand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <noscript>
          <a href={src}>Download the résumé (PDF)</a>
        </noscript>
      </div>

      {expanded ? (
        <div
          className="resume-overlay"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — résumé, expanded`}
        >
          <button
            type="button"
            className="resume-close"
            onClick={() => setExpanded(false)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* Clicks inside the document must not close it — only the backdrop. */}
          <div className="resume-overlay-doc" onClick={(e) => e.stopPropagation()}>
            {frame}
          </div>
          <p className="resume-overlay-hint">Click outside or press Esc to close</p>
        </div>
      ) : null}
    </>
  );
}
