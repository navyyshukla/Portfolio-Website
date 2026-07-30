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
  caseStudy: CaseStudySection[];
}

export const projects: Project[] = [
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
    category: "Computer vision · Audio ML",
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

/** Never more than three on "/". */
export const featuredProjects = projects.slice(0, 3);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
