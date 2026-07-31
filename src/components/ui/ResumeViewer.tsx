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
      src={`${src}#view=FitH&toolbar=1`}
      title={`${name} — résumé`}
      className="resume-iframe"
    />
  );

  return (
    <>
      <div className="resume-frame">
        <button
          type="button"
          className="resume-expand"
          onClick={() => setExpanded(true)}
          aria-label="Expand the résumé to full screen"
        >
          ⤢ Expand
        </button>
        {frame}
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
