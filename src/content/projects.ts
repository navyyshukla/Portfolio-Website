/**
 * Projects. Exactly three appear on "/". Depth lives on /work/[slug].
 *
 * Every case study answers: problem -> decisions/trade-offs -> outcome. The
 * decisions section carries the most weight with technical readers.
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
      "A news aggregator that pulls verified Indian news and sorts it into positive and negative categories, so the picture you get is the whole one.",
    category: "AI · News",
    timeframe: "Jan 2026",
    stack: ["Next.js 14", "Python", "DistilBERT", "Feedparser", "GitHub Actions", "Vercel"],
    liveUrl: "https://other-side-india.vercel.app/",
    repoUrl: "https://github.com/navyyshukla/other-side-india",
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Coverage of India skews hard in whichever direction a given outlet leans. Read one source and you get a country that is either collapsing or flawless — never the real mix of both.",
          "The aim was to aggregate news from trusted, verified sources and deliberately surface both sides: what is going wrong and what is going right, side by side.",
        ],
      },
      {
        heading: "Decisions and trade-offs",
        body: [
          "The core design decision was the taxonomy itself — splitting stories into positive and negative streams and then into five categories on each side. Getting those categories right mattered more than the model did: too broad and everything collapses into one bucket, too narrow and most stories fit nowhere.",
          "Classification runs on DistilBERT rather than a larger transformer. It is a distilled model, so it is small and fast enough to run inside a scheduled GitHub Actions job at no cost — the accuracy trade-off was worth removing the need for any always-on inference server.",
          "Retrieval is a scheduled GitHub Actions workflow rather than a live backend. There is no server to keep running, no database to pay for, and the archive is rebuilt on a fixed cadence.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "A live archive of 200+ curated stories, refreshed daily by automated workflows, with a responsive Next.js 14 front end.",
        ],
      },
    ],
  },
  {
    slug: "music-genre-classifier",
    title: "AI Music Genre Classifier",
    summary:
      "A CNN that classifies music genres from raw audio, trained on Mel spectrograms and deployed as a live app you can feed your own tracks.",
    category: "Machine Learning",
    timeframe: "Oct — Nov 2025",
    stack: ["Python", "TensorFlow (Keras)", "Scikit-learn", "Streamlit", "Git"],
    liveUrl: "https://ai-music-classifier-app-dep.streamlit.app",
    repoUrl: "https://github.com/navyyshukla/AI-Music-Classifier-App",
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Genre is a slippery label — the boundaries between neighbouring genres are blurry even to people. The task was to get a model to make that call from raw audio alone, reliably enough to be worth using.",
        ],
      },
      {
        heading: "Decisions and trade-offs",
        body: [
          "Audio was converted to Mel spectrograms and treated as an image problem, so a CNN could be used instead of a sequence model. Mel scaling weights the frequency axis the way human hearing does, which is the right prior for a task defined by how music sounds to people.",
          "The biggest gain came from the dataset rather than the architecture. Advanced audio augmentation was used to build a more robust training set, pushing accuracy up to roughly 72% across ten genres — chasing model size would have cost far more for less.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "A Streamlit app that takes a user's own audio and returns a real-time prediction with visualisations, holding up well across around ten genres.",
        ],
      },
    ],
  },
  {
    slug: "stock-prediction-dashboard",
    title: "Stock Price Prediction Dashboard",
    summary:
      "A containerised dashboard that visualises stock data in real time and forecasts prices with SVR and Random Forest models.",
    category: "Data · ML",
    timeframe: "Aug 2025",
    stack: ["Python", "Dash", "Plotly", "Docker", "Hugging Face Spaces"],
    liveUrl: "https://huggingface.co/spaces/navyyshukla/stock-prediction-app",
    repoUrl: "https://github.com/navyyshukla/stock_prediction_dash_app",
    caseStudy: [
      {
        heading: "The problem",
        body: [
          "Stock analysis tools tend to be either a static chart or a black-box prediction. The goal was one surface that does both — live visualisation alongside a forecast you can actually see the shape of.",
        ],
      },
      {
        heading: "Decisions and trade-offs",
        body: [
          "Support Vector Regression and Random Forest were chosen over a deep model. On this much data a neural network would mostly overfit, and these two train in seconds, which keeps the dashboard interactive rather than something you wait on.",
          "The whole system was containerised with Docker and deployed to Hugging Face Spaces, so the environment that runs in production is the same one it was built in, at no hosting cost.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "A live, end-to-end dashboard running as a public service, combining real-time visualisation with SVR and Random Forest forecasting.",
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
