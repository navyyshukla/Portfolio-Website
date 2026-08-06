"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { beyond } from "@/content/beyond";

/**
 * Gate in front of the story path. The canvas module is not fetched until the
 * visitor asks for it — so it costs nothing on "/", and nothing on
 * /beyond-code either until this button is pressed.
 */
const StoryPath = dynamic(() => import("./StoryPath"), {
  ssr: false,
  loading: () => <p className="eyebrow">Loading…</p>,
});

export function StoryLauncher() {
  const [open, setOpen] = useState(false);

  if (open) return <StoryPath />;

  return (
    <div className="story-teaser">
      <h3>{beyond.story.title}</h3>
      <p>{beyond.story.blurb}</p>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        Open the path
      </button>
    </div>
  );
}
