/**
 * Everything that is not the job search: hobbies, free time, extracurriculars.
 *
 * This content renders ONLY on /beyond-code. It must never appear on "/".
 * Write it in your own voice — this is the page where personality is the point.
 */

export interface BeyondEntry {
  title: string;
  /** e.g. "Hobby", "Extracurricular", "Community". Used as a small label. */
  kind: string;
  body: string;
}

export interface BeyondContent {
  /** Short framing sentence at the top of the page. */
  intro: string;
  entries: BeyondEntry[];
  /** Copy for the game section. The game itself is lazy-loaded. */
  game: {
    title: string;
    /** One or two sentences: what it is, and that it is entirely optional. */
    blurb: string;
    /** Shown instead of the game when reduced motion is preferred. */
    reducedMotionNote: string;
  };
}

export const beyond: BeyondContent = {
  // TODO(content): all of the below.
  intro:
    "TODO: A sentence framing this page — the things you do that have nothing to do with a job title.",
  entries: [
    {
      title: "TODO: Something you do",
      kind: "TODO: Hobby",
      body: "TODO: A few sentences. Specific beats generic.",
    },
    {
      title: "TODO: Something else",
      kind: "TODO: Extracurricular",
      body: "TODO",
    },
  ],
  game: {
    title: "TODO: Game name",
    blurb:
      "TODO: What it is, in one or two sentences. Make clear it is entirely optional.",
    reducedMotionNote:
      "This game uses motion. You have reduced motion enabled, so it starts paused — press Play if you would like to run it anyway.",
  },
};
