"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Résumé viewer with our own control bar.
 *
 * Why not the browser's toolbar: `<iframe src="file.pdf">` loads Chrome's full
 * PDF viewer (top bar plus thumbnail sidebar), while `<object>`/`<embed>` load
 * the minimal embedded viewer with a small floating panel. Neither is
 * controllable from the page, and which one you get varies by browser. So the
 * native chrome is suppressed and the controls are ours — consistent
 * everywhere, and the expand action can live beside zoom where it belongs.
 *
 * Zoom uses the PDF `#zoom=` fragment, which is the only reliable way to zoom
 * an embedded PDF. Changing it needs a remount, hence `key`.
 */

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];
const DEFAULT_ZOOM = 100;

export function ResumeViewer({ src, name }: { src: string; name: string }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [expanded, setExpanded] = useState(false);

  const step = useCallback((direction: 1 | -1) => {
    setZoom((current) => {
      const i = ZOOM_STEPS.indexOf(current);
      const next = i === -1 ? DEFAULT_ZOOM : ZOOM_STEPS[i + direction];
      return next ?? current;
    });
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // `toolbar=0&navpanes=0` suppresses the browser's own chrome where it is
  // honoured. `key` forces the remount that a zoom change requires.
  const frame = (
    <iframe
      key={zoom}
      src={`${src}#toolbar=0&navpanes=0&statusbar=0&zoom=${zoom}`}
      title={`${name} — résumé`}
      className="resume-iframe"
    />
  );

  const controls = (
    <div className="resume-bar">
      <div className="resume-zoom">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={zoom === ZOOM_STEPS[0]}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="resume-zoom-val" aria-live="polite">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="resume-bar-right">
        <button
          type="button"
          onClick={() => setZoom(DEFAULT_ZOOM)}
          disabled={zoom === DEFAULT_ZOOM}
          aria-label="Reset zoom to 100%"
          title="Reset zoom"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
          </svg>
        </button>
        <a href={src} download aria-label="Download the résumé as a PDF" title="Download">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v11M7 12l5 5 5-5M5 20h14" />
          </svg>
        </a>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand the résumé to full screen"
            title="Expand"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        ) : (
          <button type="button" onClick={() => setExpanded(false)} aria-label="Close" title="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="resume-shell">
        <div className="resume-frame">{frame}</div>
        {!expanded ? controls : null}
      </div>

      {expanded ? (
        <div
          className="resume-overlay"
          data-lenis-prevent
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — résumé, expanded`}
        >
          <div className="resume-overlay-doc" onClick={(e) => e.stopPropagation()}>
            <div className="resume-frame">{frame}</div>
            {controls}
          </div>
          <p className="resume-overlay-hint">Click outside or press Esc to close</p>
        </div>
      ) : null}
    </>
  );
}
