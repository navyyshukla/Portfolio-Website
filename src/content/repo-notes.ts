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
 * **Nothing here reaches the assistant.** `corpus.ts` reads `repos.ts`, not
 * this file, and that separation is deliberate: the core corpus sits at 1,555
 * tokens against a 1,600 budget, so a page can afford long prose and the prompt
 * cannot. Write freely here; it costs a visitor nothing and the assistant
 * nothing.
 *
 * Keyed by the slug in `repos.ts`. A stale key is harmless; a missing one just
 * means the scraped wording still shows.
 */

import type { CaseStudySection } from "./projects";
import type { ArtKey } from "@/components/ui/project-art";

export interface RepoNote {
  /** Replaces the scraped summary. One or two sentences, same voice as a case study. */
  blurb: string;
  /** Replaces the scraped highlights entirely. Omit to keep the synced ones. */
  highlights?: string[];
  /**
   * The write-up on `/projects/<slug>`. Same shape as a case study, because it
   * is the same job — a visitor who clicked wants to know what was built and
   * what was hard, not a rephrased README.
   */
  sections?: CaseStudySection[];
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
  /** Which drawing to put on the cover. See `project-art.tsx`. */
  art?: ArtKey;
}

export const repoNotes: Record<string, RepoNote> = {
  agrobot: {
    coverTitle: "AGROBOT",
    coverLine: "Sows a row, and checks the soil first",
    art: "agrobot",
    blurb:
      "A seed-sowing robot built for a college project: it drives itself down a row, checks the soil before it commits, and drops seed at a fixed spacing.",
    highlights: [
      "Ultrasonic ranging for obstacles and a moisture probe for the ground, so the robot refuses to sow where sowing would be wasted.",
      "A servo meters individual seeds rather than pouring them, which is the difference between a spacing figure and a pile.",
      "Arduino Uno with an L293D shield for drive, and an HC-05 link to an Android app when the operator wants to override the autonomous run.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "Sowing by hand on a small plot is slow and uneven, and the machinery that fixes it is priced for farms an order of magnitude larger. The brief was a robot that a smallholder could actually afford — which rules out the interesting sensors and most of the drivetrain before the design starts.",
        ],
      },
      {
        heading: "Driving itself down a row",
        body: [
          "An Arduino Uno with an L293D motor shield drives the DC motors, and an HC-SR04 ultrasonic sensor watches the path ahead. Detecting an obstacle is the easy half; the robot has to stop and change course without losing its place in the row, because a seed drill that wanders has made the spacing meaningless.",
        ],
      },
      {
        heading: "Metering seed, not pouring it",
        body: [
          "A servo releases seed one at a time from the hopper rather than opening a gate. That is the difference between a stated spacing and a pile — a continuous feed puts a cluster wherever the robot slows down, and a cluster is competition rather than a crop.",
        ],
      },
      {
        heading: "Not sowing where it would be wasted",
        body: [
          "A soil moisture probe reads the ground before the servo fires. If the patch is too dry, the robot moves on rather than spending seed on it. This is the part that justifies the sensors at all: an automated sower that ignores the ground is just a faster way to waste seed.",
        ],
      },
      {
        heading: "Keeping a human in reach",
        body: [
          "An HC-05 Bluetooth module pairs with a custom Android app, so the operator can take manual control at any point. Full autonomy was never the goal — on a small plot, the person is standing right there, and the useful design lets them intervene rather than watch.",
        ],
      },
    ],
  },

  "creatorjoy-ai-pipeline": {
    coverTitle: "CreatorJoy",
    coverLine: "A YouTube link in, an avatar video out",
    art: "creatorjoy",
    blurb:
      "A zero-touch pipeline that turns a YouTube URL and a topic into a lip-synced avatar video: it pulls the thumbnail, writes a script, clones the voice and renders the result without anyone in the loop.",
    highlights: [
      "Seven asynchronous n8n stages orchestrate the whole run; the workflow itself is committed as JSON rather than described in prose.",
      "Groq serves the script generation, where inference latency is what decides whether the pipeline feels automated or merely batch.",
      "Built modular because enterprise APIs fight back — D-ID returns 451 CelebrityDetectedError on recognisable faces, so each stage has to fail without taking the run with it.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "Producing a short avatar video by hand means touching four or five services in order: pull a thumbnail, write a script, generate a voice, render the lip-sync, file the result. Each is a few minutes of clicking, and none of it is a decision. The brief was to make the whole chain a single POST request.",
        ],
      },
      {
        heading: "Seven stages, none of them waiting on a person",
        body: [
          "A webhook takes a YouTube URL and a topic. A code node parses the video ID and derives the high-resolution thumbnail URL, which becomes the avatar's face — no upload step, because the face is already public.",
          "Groq writes a targeted sixty-second script from the topic. Fal.ai's F5-TTS clones the voice from a reference sample and returns a WAV. D-ID combines the face and the audio into a lip-synced MP4. A Supabase node logs the source URL, the topic and the finished video, and a React dashboard reads that table.",
        ],
      },
      {
        heading: "The APIs fight back",
        body: [
          "D-ID returns 451 CelebrityDetectedError on recognisable faces — a deliberate guard against deepfaking well-known people, and one that fires on exactly the creators a tool like this is pointed at. That is a product constraint discovered at runtime, not a bug to route around, and it is the reason the pipeline is built as independent stages: a refusal at render should not discard the script and the cloned audio above it.",
        ],
      },
      {
        heading: "Waiting is part of the design",
        body: [
          "Video rendering is slow and D-ID is asynchronous: the POST returns a tracking ID, not a file. An explicit wait node holds the pipeline for thirty seconds before the GET, which is the unglamorous difference between a workflow that completes and one that times out halfway and leaves a half-finished record in the database.",
        ],
      },
      {
        heading: "Why n8n rather than a script",
        body: [
          "The whole thing could be a Python file. As an n8n workflow each stage is inspectable while it runs, a failed execution can be replayed from the node that broke rather than from the top, and the workflow ships as committed JSON — so the repository holds the actual pipeline rather than a description of one.",
        ],
      },
    ],
  },

  digitrecognition: {
    coverTitle: "Digit Recognition",
    coverLine: "A CNN that reads handwriting",
    art: "digits",
    blurb:
      "A convolutional network over MNIST, written to understand the architecture rather than to beat a benchmark — every layer chosen deliberately and the result checked against handwriting the model never saw.",
    highlights: [
      "A sequential CNN in TensorFlow and Keras: stacked convolution and pooling blocks into a dense classifier.",
      "Kept as a notebook on purpose, so the intermediate feature maps stay visible instead of disappearing into a training script.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "MNIST is the one problem in machine learning with no novelty left in it, which is exactly why it is worth doing once by hand. The goal was not a competitive number — it was to build a convolutional network where every layer is there for a reason I can state, rather than copied from a tutorial.",
        ],
      },
      {
        heading: "Why convolution rather than a dense net",
        body: [
          "A fully connected layer over raw pixels treats position as identity: a 7 drawn two pixels to the left is a different input entirely. Convolution shares weights across the image, so a stroke is the same stroke wherever it falls — the prior that makes the problem tractable with a small model.",
          "Pooling after each convolution block shrinks the map and widens what the next filter sees, so early layers pick up edges and later ones see whole strokes.",
        ],
      },
      {
        heading: "Kept as a notebook, deliberately",
        body: [
          "The work lives in a Jupyter notebook rather than a training script, because the intermediate output is the point. Feature maps, the loss curve and the misclassified digits are all visible inline — in a script they are side effects you would have to go looking for, and mostly would not.",
          "The repository also carries a written report covering the background, the architecture and the analysis, for the same reason: the value here is the explanation, not the weights.",
        ],
      },
      {
        heading: "Where it is honest about itself",
        body: [
          "The README's accuracy figure is still a placeholder — the notebook reports a real number when it runs, but the summary was never filled in. Rather than quote something plausible, this page says so and points at the notebook, which is where the measured result actually lives.",
        ],
      },
    ],
  },

  "ml-for-nextgen-wireless-networks": {
    coverTitle: "NextGen Wireless",
    coverLine: "Allocating satellite links with deep RL",
    art: "wireless",
    blurb:
      "Machine learning applied to next-generation wireless: a deep reinforcement learning agent that allocates resources across satellite, terrestrial and reflecting-surface links, trading energy against latency as conditions change.",
    highlights: [
      "A Deep Q-Network with experience replay decides task offloading and resource allocation across a combined satellite-terrestrial-IRS network.",
      "The agent also tunes the reflecting surface's phase shifts, so the radio environment itself is part of what it controls.",
      "Validated over 300 simulation episodes against baseline allocation strategies, on latency, energy and total reward.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "A device at the edge of a network has to decide where to run a task: locally, at a terrestrial base station, or via satellite. Each choice trades energy against latency, and the right answer changes as the user moves and the channel varies. Fixed allocation rules are tuned for conditions that hold on average and are wrong most of the time.",
        ],
      },
      {
        heading: "Three technologies in one model",
        body: [
          "The research combines satellite networks for coverage, terrestrial networks for throughput, and intelligent reflecting surfaces — passive arrays that steer signal by changing the phase of what they reflect — into a single framework. Prior work generally models one or two; the contribution is treating all three as one decision problem.",
        ],
      },
      {
        heading: "Why reinforcement learning",
        body: [
          "The state is continuous and non-stationary: user positions, channel quality, queue depths. A Deep Q-Network with experience replay learns a policy from interaction rather than from an analytical model that would have to assume away the interesting parts.",
          "Experience replay matters here more than usual — consecutive timesteps in a mobility simulation are heavily correlated, and training on them in order makes the agent forget everything but the last few seconds.",
        ],
      },
      {
        heading: "Controlling the environment, not just the choice",
        body: [
          "The agent also sets the reflecting surface's phase shifts to maximise data rate for users offloading to the edge. This is the part that makes the problem unusual: it is not only choosing among links, it is reshaping the radio environment those links travel through.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Tested over 300 simulation episodes, the agent improved latency, energy efficiency and total system reward against baseline allocation strategies, and adapted to mobility and channel variation rather than degrading under them. The full system model, method and results are in the paper in the repository.",
        ],
      },
    ],
  },

  "n8n-social-media-pipeline": {
    coverTitle: "Social Pipeline",
    coverLine: "A topic in, a thread out, on a schedule",
    art: "pipeline",
    blurb:
      "A content pipeline that takes a topic from a form, writes a thread with Groq, archives it in Supabase, and delivers it to two Discord channels at once.",
    highlights: [
      "Intake → process → log → deliver, with the archive written before delivery so nothing is generated and then lost.",
      "The system prompt holds the output under Discord's 2,000-character limit, which makes a platform constraint a generation constraint rather than a truncation bug.",
      "Delivery branches to two channels in parallel: a status ping for the team and the full draft for whoever is publishing.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "Drafting social threads is repetitive work that still needs a person to approve it. The useful split is to automate the drafting and the filing, and leave the judgement — which is the only part a human is actually needed for.",
        ],
      },
      {
        heading: "Intake without backend access",
        body: [
          "The entry point is an n8n web form, so anyone on the team can submit a topic without touching the workflow or holding credentials. Making the intake a form rather than a webhook is what turns this from a developer's script into something the team can use.",
        ],
      },
      {
        heading: "Generation shaped by where it is going",
        body: [
          "Groq's Llama 3.1 8B writes the thread, and the system prompt holds it under Discord's 2,000-character ceiling. That is deliberate: the alternative is generating freely and truncating at delivery, which cuts mid-sentence and destroys the last post of a thread. A platform limit is easier to respect at generation than to repair afterwards.",
        ],
      },
      {
        heading: "Log before delivering",
        body: [
          "The raw idea and the generated content are written to Supabase before either Discord webhook fires. Ordering it this way means a delivery failure costs a notification, not the draft — the opposite order loses generated content whenever the last step fails.",
        ],
      },
      {
        heading: "Two channels, one execution",
        body: [
          "Delivery branches in parallel: #thread-alerts gets a short status ping so the team knows something landed, #full-drafts gets the formatted thread for review. Separating them keeps the working channel readable — a single channel carrying both statuses and full drafts becomes one nobody reads.",
        ],
      },
    ],
  },

  "portfolio-website": {
    coverTitle: "This Site",
    coverLine: "Next.js 16, static, with a grounded assistant",
    art: "site",
    blurb:
      "This site. Next.js 16 on the App Router, statically generated apart from one streaming chat route, with a grounded assistant that answers from a corpus built out of the repository's own content files.",
    sections: [
      {
        heading: "The constraint that shaped it",
        body: [
          "The audience is recruiters, so the homepage delivers everything without a single interaction — no click-to-reveal, nothing personal competing with the work. Every page is statically generated; the only dynamic route in the entire build is the chat endpoint.",
        ],
      },
      {
        heading: "An assistant with no vector store",
        body: [
          "Visitors can ask about the work, and the answer is grounded in a corpus assembled from this repository's own content files. Retrieval is about 130 lines of IDF-weighted term overlap — no embeddings, no vector database, no network call, no cold start. It is deterministic, which means it can be tested, and it is, on every push.",
          "The corpus is gated rather than sent whole: a core layer always, plus at most three matching detail documents. Because an index naming every project always ships, a retrieval miss costs depth, never existence.",
        ],
      },
      {
        heading: "Prompt size is the capacity budget",
        body: [
          "The free tier's binding limit is tokens per day, not requests, and the prompt is resent on every call. At the current peak that works out to roughly 28 questions a day before overflow takes over — so every token added to the corpus is taken directly out of a visitor's answer. An eval fails the build on a retrieval miss or a budget breach.",
        ],
      },
      {
        heading: "Kept under 200 KB",
        body: [
          "First-load JavaScript on the homepage is held under a self-imposed 200 KB gzipped cap. Three.js, Lenis, react-markdown and the entire chat UI sit behind next/dynamic; images are AVIF; the project hover clips fetch zero bytes until hovered, and render no video element at all on touch devices or under reduced motion.",
        ],
      },
    ],
  },

  "rtsp-overlay-app": {
    coverTitle: "RTSP Overlay",
    coverLine: "Live overlays on a video feed",
    art: "overlay",
    blurb:
      "A full-stack app for putting live overlays on an RTSP stream — the feed is transcoded to something a browser will actually play, and text and image overlays are dragged, resized and persisted on top of it.",
    highlights: [
      "RTSP transcoded to HLS server-side, because browsers do not speak RTSP and the alternative is asking the visitor to install something.",
      "Overlays are dragged and resized directly on the video with react-rnd, and their position, size and style persist in MongoDB through a Flask CRUD API.",
      "A studio mode gives full-window playback while overlays stay interactive.",
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "RTSP is what cameras speak and no browser will play it. Anything that wants a camera feed on a web page has to solve that first, and then solve the actual problem — letting someone put a caption or a logo on the stream and have it still be there tomorrow.",
        ],
      },
      {
        heading: "Getting the stream into a browser at all",
        body: [
          "The feed is transcoded server-side to HLS and played with hls.js. The alternative — a desktop client, or a browser plugin — means asking the viewer to install something, which for a tool whose whole appeal is that it opens in a tab defeats the point.",
        ],
      },
      {
        heading: "Overlays that behave like objects",
        body: [
          "Overlays are positioned and resized directly on the video with react-rnd, rather than through a form of coordinates beside it. Direct manipulation is the difference between a configuration screen and an editor, and for something this visual the feedback has to be the thing itself.",
        ],
      },
      {
        heading: "Persistence is the actual feature",
        body: [
          "Position, size and style are stored in MongoDB behind a Flask REST API with full CRUD. Overlays held only in component state disappear on reload, which makes the tool a demo — persistence is what turns a layout into a saved configuration somebody can return to.",
        ],
      },
      {
        heading: "Studio mode",
        body: [
          "A full-window playback mode keeps the overlays interactive rather than flattening them into the picture, so the layout can be adjusted while watching at full size instead of in a small editing pane.",
        ],
      },
    ],
  },
};
