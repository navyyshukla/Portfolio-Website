/**
 * Projects.
 *
 * Written from the repositories themselves — `ai_scraper.py`,
 * `feature_extractor.py`, `train_model.py` and the dashboard README — not from
 * the résumé. The point of this page is to say what the résumé cannot fit: the
 * decisions, the trade-offs and the things that turned out to be hard.
 */

export interface CaseStudySection {
  heading: string;
  body: string[];
}

/**
 * The preview shown in the browser-chrome frame on "/" and at the top of the
 * case study. Every path points into `public/shots/`, written by
 * `npm run capture:shots` — do not hand-author these files.
 *
 * Optional on purpose: a project with nothing captured yet renders the card
 * with no frame at all rather than a broken image.
 */
export interface ProjectMedia {
  /** Viewport-sized capture. The still that ships on first load. */
  poster: string;
  /** Intrinsic pixels of `poster`, so the frame reserves its box and CLS is 0. */
  width: number;
  height: number;
  /** What the app does, for screen readers. Not "a screenshot of X". */
  alt: string;
  /** Hostname drawn in the frame's address bar. */
  host: string;
  /**
   * Full-page capture, taller than the frame. When present the frame pans it
   * on hover with a CSS transform — motion for zero extra bytes and zero JS.
   */
  tall?: string;
  /** Intrinsic height of `tall`; the width matches `width`. */
  tallHeight?: number;
  /**
   * Muted WebM loop. Never fetched until the visitor hovers or focuses the
   * card, so it costs nothing on first load. Absent is fine — the pan covers it.
   */
  video?: string;
}

/**
 * A sample of the project's own output, drawn in a terminal frame.
 *
 * For projects that have no screen to capture. A command-line tool framed in
 * browser chrome would be a lie, and a generated cover says nothing about what
 * it does — its output is the honest demo. Takes precedence over `media` when
 * both are set, which no project currently does.
 */
export interface ProjectTerminal {
  /** Drawn where the browser frame draws its hostname. */
  title: string;
  /** One string per line. Rendered verbatim in a monospace block. */
  lines: string[];
  /** What the sample shows, for screen readers. Not "a terminal window". */
  alt: string;
}

export interface Project {
  slug: string;
  title: string;
  /** One line, shown on the card at "/". */
  summary: string;
  category: string;
  stack: string[];
  timeframe: string;
  repoUrl?: string;
  liveUrl?: string;
  media?: ProjectMedia;
  terminal?: ProjectTerminal;
  caseStudy: CaseStudySection[];
}

export const projects: Project[] = [
  {
    slug: "margin",
    title: "Margin",
    summary:
      "A compressor for the JSON you paste into an LLM prompt. 41.6% fewer tokens across eight real APIs, 73.7% with the content store, and a model was asked whether the answers still hold.",
    category: "Developer tooling",
    timeframe: "Sep 2026",
    stack: [
      "Python",
      "MCP",
      "tiktoken",
      "pytest",
      "Property-based testing",
      "uv",
    ],
    repoUrl: "https://github.com/navyyshukla/Margin",
    terminal: {
      title: "margin",
      lines: [
        "$ curl -s api.github.com/repos/python/cpython/issues | margin",
        "",
        "#margin/v1",
        "#legend \\N = null; empty cell = key absent in that row",
        '#const{"state":"open","locked":false}',
        "[3]{number:int,title:str}",
        "37537,Fix pragmas",
        "37536,Fix inspect",
        "37535,Fix errors",
        "",
        "# 55.3% fewer tokens. decompress(compress(x)) == x",
      ],
      alt: "Margin compressing a GitHub issues response: field names written once as a header row, values shared by every record hoisted into a constants line, and the records themselves reduced to comma-separated rows — 55.3% fewer tokens.",
    },
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "An API response pasted into a prompt spends most of its tokens repeating itself. Every record restates every field name, half the keys hold the same value in all of them, and a third of a GitHub payload is link templates the model will never follow.",
          "Prompt tokens are a budget, and that budget is paid on every call. Sending the payload whole is the easiest thing to do and the most expensive.",
        ],
      },
      {
        heading: "Rules, not a model",
        body: [
          "The compressor is rule-based on purpose. Field names are written once as a header rather than once per record, values identical across every record are hoisted into a constants preamble, columns drawn from a handful of repeated values are listed once and indexed, and arrays of IDs are stored as differences rather than whole numbers.",
          "The output is a self-describing table with a legend, so the model can read the format without being taught it. That claim is not assumed — it is checked by handing the document to a model with no access to the repository.",
        ],
      },
      {
        heading: "Reversible, after one deliberate cut",
        body: [
          "One stage drops link-template and opaque-ID keys — the *_url, node_id and gravatar_id family — and nothing restores them. That cut is stated rather than hidden: a compressed GitHub payload can no longer answer \"link me to issue 37508\".",
          "Everything after that line is exactly reversible. decompress(compress(x)) is verified at runtime, and a transform that cannot be undone does not ship past it. If no stage helps, the input comes back unchanged — nothing ever leaves larger than it arrived.",
        ],
      },
      {
        heading: "Proving the answers did not move",
        body: [
          "Compression is worthless if it quietly costs accuracy, so the eval asks a model that has never seen the repository the same questions on each arm: raw 75/75, compressed 75/75, stored 73/75 across eight payloads, with 16 comprehension questions judged 16/16 on every arm.",
          "The stored arm's two misses are arithmetic over a column the store holds no handle for, and the run is recorded as failing its own bar because of them. The judge shares a model family with the answerer, which makes it the weaker instrument — so the write-up says that rather than claiming a clean sweep.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "41.6% fewer tokens across the eight APIs, from 55.3% on GitHub issues down to 0.0% on payloads that are already columnar — which the docs argue is the correct outcome rather than a gap. With the content store and the MCP server, where bulk values move out of the prompt and the model fetches them on demand, 73.7%.",
          "Every figure is measured against the file as fetched, under cl100k_base, including the ones borrowed from the project that inspired it — whose published thresholds would have rejected most of these results.",
        ],
      },
    ],
  },
  {
    slug: "other-side-of-india",
    title: "The Other Side of India",
    summary:
      "A news pipeline that hunts nine specific kinds of Indian story — four hopeful, five grim — and keeps both sides stocked, so the picture you get is never one-sided by accident.",
    category: "NLP · Data pipeline",
    timeframe: "Jan 2026",
    stack: [
      "Python",
      "DistilBERT",
      "Hugging Face Transformers",
      "Supabase (PostgreSQL)",
      "Next.js",
      "GitHub Actions",
      "Vercel",
    ],
    liveUrl: "https://other-side-india.vercel.app/",
    repoUrl: "https://github.com/navyyshukla/other-side-india",
    media: {
      poster: "/shots/other-side-of-india/poster.avif",
      width: 1440,
      height: 900,
      video: "/shots/other-side-of-india/demo.webm",
      host: "other-side-india.vercel.app",
      alt: "The site's landing screen, split down the middle: a red Dark Side half labelled 'the silence we break' against a green Bright Side half labelled 'the future we build', with a live count of media reports from the last 24 hours above them.",
    },
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Read one Indian outlet and the country is collapsing; read another and nothing is wrong. Both are selections, and neither tells you what is actually happening.",
          "The aim was a feed that holds both at once — not a neutral average, but two deliberately stocked sides you can read against each other.",
        ],
      },
      {
        heading: "Taxonomy before model",
        body: [
          "The categories are the product, so they came first: four on the bright side — AI & Innovation, Altruism, Good Governance, Advocacy — and five on the dark side — Dirty Politics, Impunity, Persecution, Corruption, Atrocity.",
          "Each category is defined by a hand-written set of six to eight Google News RSS queries rather than by a classifier. \"India tribal rights granted\" and \"India custodial death\" retrieve far more precisely than any model I could train on this budget, and when a category drifts I edit a list instead of retraining.",
          "That inverts the usual design: retrieval does the categorising, and the model is only a filter.",
        ],
      },
      {
        heading: "Where the model actually sits",
        body: [
          "DistilBERT (`sst-2`) scores sentiment on each headline. Anything under 0.70 confidence is demoted to NEUTRAL rather than forced into a bucket.",
          "The acceptance rule is deliberately asymmetric: the bright side takes anything that is not NEGATIVE, the dark side anything that is not POSITIVE. Requiring a confident positive on good news threw away most genuine reporting, because plainly-worded reporting of a good outcome reads as neutral to a sentiment model. Letting neutrals through on both sides was the fix.",
          "A blocklist strips the noise that swamps any India news query — sensex, nifty, quarterly, box office, cricket, trailer. Without it the feed fills with market moves and film promos.",
        ],
      },
      {
        heading: "Keeping every category alive",
        body: [
          "The first version capped the table globally, and the loud categories ate the quiet ones — Atrocity crowded out Advocacy within days.",
          "Retention is now enforced per category: each keeps its newest 30 and prunes below that independently. No category can starve another, so the nine-way split stays balanced without supervision.",
          "Dedup runs twice — an in-run link set, then an existence check against Supabase — because the same story surfaces under several queries.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Runs entirely on scheduled GitHub Actions against Supabase, with a Next.js front end on Vercel. There is no server to keep alive and no inference host to pay for — the whole thing costs nothing to operate.",
        ],
      },
    ],
  },
  {
    slug: "music-genre-classifier",
    title: "AI Music Genre Classifier",
    summary:
      "Turns raw audio into Mel spectrograms, trains three different CNNs against each other, and ships whichever one actually wins on a held-out test set.",
    category: "Audio ML",
    timeframe: "Oct — Nov 2025",
    stack: [
      "Python",
      "TensorFlow (Keras)",
      "librosa",
      "MobileNetV2",
      "Scikit-learn",
      "Streamlit",
    ],
    liveUrl: "https://ai-music-classifier-app-dep.streamlit.app",
    repoUrl: "https://github.com/navyyshukla/AI-Music-Classifier-App",
    media: {
      poster: "/shots/music-genre-classifier/poster.avif",
      width: 1440,
      height: 900,
      video: "/shots/music-genre-classifier/demo.webm",
      host: "ai-music-classifier-app-dep.streamlit.app",
      alt: "The classifier's upload screen: a drop zone for a WAV, MP3, FLAC or OGG file, a sidebar of analysis settings reporting the model loaded successfully across ten genres, and a panel naming the model a TensorFlow CNN over mel spectrogram images.",
    },
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Genre boundaries are blurry even to people, and GTZAN is small — a thousand thirty-second clips across ten genres. Small dataset, fuzzy labels: the two conditions most likely to produce a model that memorises rather than learns.",
        ],
      },
      {
        heading: "Making it an image problem",
        body: [
          "Audio is converted to Mel spectrograms with librosa (128 mel bands, 8 kHz ceiling) and saved as clean images with every axis, label and margin stripped — the CNN should see signal, not matplotlib chrome.",
          "Mel scaling weights frequency the way human hearing does, which is the right prior for a task whose ground truth is human judgement.",
        ],
      },
      {
        heading: "Growing the dataset instead of the model",
        body: [
          "With a thousand clips, more layers would only overfit faster. Each track is therefore augmented three ways — Gaussian noise, time stretch at 0.8×, and a four-semitone pitch shift — quadrupling the training set to roughly four thousand spectrograms.",
          "All three augmentations preserve genre while changing the surface: a slower, noisier, pitch-shifted rock track is still rock. That is exactly the invariance the model needs.",
        ],
      },
      {
        heading: "Three models, then pick",
        body: [
          "Rather than guess an architecture, the pipeline trains three and compares them on the same held-out set: a baseline CNN, a deeper CNN with dropout at 0.3 and 0.5, and MobileNetV2 with frozen ImageNet weights and a fresh head.",
          "The validation split is halved again into a real test set, so model selection never touches the data the final number is reported on — the most common way accuracy claims quietly become fiction.",
          "EarlyStopping restores the best weights rather than the last, and ReduceLROnPlateau drops the learning rate 5× when validation loss stalls. The winner is saved automatically along with the class list, so the app never needs to know which architecture won.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Around 72% test accuracy across ten genres, served as a Streamlit app that takes your own audio and returns a live prediction with visualisations. The class list is read from the folder structure, so adding a genre needs no code change.",
        ],
      },
    ],
  },
  {
    slug: "stock-prediction-dashboard",
    title: "Stock Price Prediction Dashboard",
    summary:
      "An interactive dashboard that pulls any ticker, charts it with technical indicators, and forecasts forward using an ensemble of three regressors.",
    category: "Data viz · ML",
    timeframe: "Aug 2025",
    stack: [
      "Python",
      "Dash",
      "Plotly",
      "Scikit-learn",
      "yfinance",
      "Docker",
      "Gunicorn",
      "Hugging Face Spaces",
    ],
    liveUrl: "https://huggingface.co/spaces/navyyshukla/stock-prediction-app",
    repoUrl: "https://github.com/navyyshukla/stock_prediction_dash_app",
    media: {
      poster: "/shots/stock-prediction-dashboard/poster.avif",
      width: 1440,
      height: 900,
      video: "/shots/stock-prediction-dashboard/demo.webm",
      host: "huggingface.co",
      alt: "The dashboard showing a year of GOOGL: a control panel for ticker, date range and analysis type on the left, and a line chart of opening against closing price through 2023 filling the panel beside it.",
    },
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Stock tools tend to be either a static chart or a black-box number. The goal was one surface where you can see the history, the indicator and the forecast together, and judge the forecast against the thing it came from.",
        ],
      },
      {
        heading: "An ensemble, not a neural net",
        body: [
          "Forecasting runs on three regressors together — Support Vector Regression, Random Forest and Gradient Boosting — rather than a deep model.",
          "On a few years of daily prices a neural network mostly memorises noise, and these three fail differently: SVR is smooth and biased, the tree ensembles are jumpy and low-bias. Averaging them cancels a good deal of individual error.",
          "They also train in seconds, which is what lets the dashboard stay interactive — you change the ticker and the horizon and get an answer immediately, instead of waiting on a job.",
        ],
      },
      {
        heading: "Context, not just a line",
        body: [
          "Entering a ticker pulls the company's logo, name and business summary from yfinance, so you know what you are looking at before you read the chart.",
          "Historical open and close render over any date range, with a 20-day exponential moving average layered on — the forecast is always shown against a trend line rather than in isolation.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Containerised with Docker and served by Gunicorn on Hugging Face Spaces, so the environment that runs in production is the one it was built in. Works for US and Indian tickers alike.",
        ],
      },
    ],
  },
];

/**
 * Never more than four on "/".
 *
 * Was three until Margin earned a place beside them. Four is the ceiling for
 * the same reason three was: a recruiter scanning the page should reach Skills
 * and Contact without a scroll that feels like work. The rest of the catalogue
 * lives at "/projects".
 */
export const featuredProjects = projects.slice(0, 4);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/**
 * Copy for "/projects" — the full catalogue.
 *
 * Here rather than in the component, for the same reason every other string is:
 * components hardcode no user-facing text.
 */
export const projectsPage = {
  eyebrow: "Everything",
  title: "All projects",
  intro:
    "Every project with a written record behind it — the four case studies above, and the repositories that never got a deployment but still hold decisions worth reading.",
  backLabel: "← Back home",
  noDeploy: "No live deployment — the source is the artifact.",
  sourceLabel: "Source ↗",
  liveLabel: "Live app ↗",
} as const;
