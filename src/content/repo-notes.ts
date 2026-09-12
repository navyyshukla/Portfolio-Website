/**
 * Curated wording for the repositories in `repos.ts`.
 *
 * `repos.ts` is generated: its summaries and highlights are scraped out of each
 * README by `npm run sync:github`, which is good enough to feed the assistant
 * and too rough to publish. "Key Features: Automated Movement: The robot
 * navigates autonomously" is a machine reading a heading, not a sentence.
 *
 * So anything a visitor actually reads comes from here. `npm run sync:github`
 * never writes this file, which is the whole point — it is the one place a
 * repository's wording survives a re-sync. Where a slug is absent, or a field
 * omitted, the synced text is used as-is.
 *
 * Keyed by the slug in `repos.ts`. A stale key is harmless; a missing one just
 * means the scraped wording still shows.
 */

export interface RepoNote {
  /** Replaces the scraped summary. One or two sentences, same voice as a case study. */
  blurb: string;
  /** Replaces the scraped highlights entirely. Omit to keep the synced ones. */
  highlights?: string[];
  /**
   * A shorter name for the generated cover, where the full title is really a
   * sentence. Omit and the cover trims the title itself.
   */
  coverTitle?: string;
  /**
   * What the project does, in a few words, drawn under the name on the cover.
   * Omit and the cover falls back to "Category · Language", which says what
   * kind of thing it is but not what it is *for*.
   */
  coverLine?: string;
}

export const repoNotes: Record<string, RepoNote> = {
  agrobot: {
    coverTitle: "AGROBOT",
    coverLine: "Sows a row, and checks the soil first",
    blurb:
      "A seed-sowing robot built for a college project: it drives itself down a row, checks the soil before it commits, and drops seed at a fixed spacing.",
    highlights: [
      "Ultrasonic ranging for obstacles and a moisture probe for the ground, so the robot refuses to sow where sowing would be wasted.",
      "A servo meters individual seeds rather than pouring them, which is the difference between a spacing figure and a pile.",
      "Arduino Uno with an L293D shield for drive, and an HC-05 link to an Android app when the operator wants to override the autonomous run.",
    ],
  },

  "creatorjoy-ai-pipeline": {
    coverTitle: "CreatorJoy",
    coverLine: "A YouTube link in, an avatar video out",
    blurb:
      "A zero-touch pipeline that turns a YouTube URL and a topic into a lip-synced avatar video: it pulls the thumbnail, writes a script, clones the voice and renders the result without anyone in the loop.",
    highlights: [
      "Seven asynchronous n8n stages orchestrate the whole run; the workflow itself is committed as JSON rather than described in prose.",
      "Groq serves the script generation, where inference latency is what decides whether the pipeline feels automated or merely batch.",
      "Built modular because enterprise APIs fight back — D-ID returns 451 CelebrityDetectedError on recognisable faces, so each stage has to fail without taking the run with it.",
    ],
  },

  digitrecognition: {
    coverTitle: "Digit Recognition",
    coverLine: "A CNN that reads handwriting",
    blurb:
      "A convolutional network over MNIST, written to understand the architecture rather than to beat a benchmark — every layer chosen deliberately and the result checked against handwriting the model never saw.",
    highlights: [
      "A sequential CNN in TensorFlow and Keras: stacked convolution and pooling blocks into a dense classifier.",
      "Kept as a notebook on purpose, so the intermediate feature maps stay visible instead of disappearing into a training script.",
    ],
  },

  "ml-for-nextgen-wireless-networks": {
    coverTitle: "NextGen Wireless",
    coverLine: "Allocating satellite links with deep RL",
    blurb:
      "Machine learning applied to next-generation wireless channels — predicting link behaviour from measured conditions instead of relying on an analytical model that assumes them.",
  },

  "n8n-social-media-pipeline": {
    coverTitle: "Social Pipeline",
    coverLine: "A topic in, a thread out, on a schedule",
    blurb:
      "A scheduled content pipeline: n8n generates posts with Groq, stores them in Supabase, and publishes on a cadence without anyone opening the app.",
    highlights: [
      "Postgres under Supabase holds both the queue and the record of what already went out, so a re-run cannot double-post.",
      "Groq handles generation, and the workflow is version-controlled as JSON rather than living only inside the n8n UI.",
    ],
  },

  "portfolio-website": {
    coverTitle: "This Site",
    coverLine: "Next.js 16, static, with a grounded assistant",
    blurb:
      "This site. Next.js 16 on the App Router, statically generated apart from one streaming chat route, with a grounded assistant that answers from a corpus built out of the repository's own content files.",
  },

  "rtsp-overlay-app": {
    coverTitle: "RTSP Overlay",
    coverLine: "Live overlays on a video feed",
    blurb:
      "A full-stack app for putting live overlays on an RTSP video feed — the stream is transcoded to something a browser will actually play, and overlays are positioned and persisted on top of it.",
    highlights: [
      "RTSP transcoded to HLS server-side, because browsers do not speak RTSP and the alternative is asking the visitor to install something.",
      "Overlay positions and content persist in MongoDB through a Flask API, so a layout survives a reload rather than living in component state.",
    ],
  },
};
