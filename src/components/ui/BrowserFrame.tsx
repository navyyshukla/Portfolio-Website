import Image from "next/image";
import type { ProjectMedia } from "@/content/projects";

/**
 * A screenshot in browser chrome.
 *
 * The chrome is the whole point: the same PNG reads as "a picture" on its own
 * and as "a thing that shipped and has a URL" once it has a title bar and an
 * address. It costs one `<div>` and no JavaScript — no `'use client'` here, and
 * deliberately none of the hover behaviour either. That lives in CSS, driven by
 * `.work-row:hover` and `:focus-within`, so the keyboard gets it for free and
 * the homepage bundle stays flat.
 *
 * `children` is where the hover-to-play video slots in over the poster.
 */
export function BrowserFrame({
  media,
  sizes,
  children,
}: {
  media: ProjectMedia;
  sizes: string;
  children?: React.ReactNode;
}) {
  const { poster, width, height, alt, host, tall, tallHeight } = media;

  // The pan capture is taller than the frame; how much taller decides how far
  // it can travel on hover. Without one the frame just holds the still.
  const pans = Boolean(tall && tallHeight && tallHeight > height);
  const src = pans ? (tall as string) : poster;
  const renderedHeight = pans ? (tallHeight as number) : height;

  return (
    <div
      className={`bframe${pans ? " bframe--pans" : ""}`}
      style={
        {
          // Reserves the box before the image arrives, so nothing shifts.
          "--frame-ratio": `${width} / ${height}`,
          // How far the tall capture may travel: its overhang, in pixels of
          // its own intrinsic scale, expressed as a share of the frame.
          "--pan-distance": `-${((renderedHeight - height) / height) * 100}%`,
        } as React.CSSProperties
      }
    >
      <div className="bframe-bar" aria-hidden="true">
        <span className="bframe-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="bframe-url">{host}</span>
      </div>

      <div className="bframe-screen">
        <Image
          className="bframe-shot"
          src={src}
          alt={alt}
          width={width}
          height={renderedHeight}
          sizes={sizes}
        />
        {children}
      </div>
    </div>
  );
}
