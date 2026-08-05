/**
 * Repositories, generated from GitHub by `npm run sync:github`.
 *
 * GENERATED FILE — re-running the script overwrites it, hand edits included.
 * If an entry needs permanent wording, promote it to a full case study in
 * `projects.ts`; the script skips any repo already recorded there.
 *
 * These feed the assistant only. Nothing here renders on the site.
 * Last synced: 2026-08-05
 */

export interface Repo {
  slug: string;
  title: string;
  summary: string;
  category: string;
  stack: string[];
  timeframe: string;
  repoUrl: string;
  liveUrl?: string;
  /** "Heading: one or two sentences", pulled from the README's own sections. */
  highlights: string[];
  /** Retrieval terms. Not shown to anyone. */
  keywords: string[];
}

export const repos: Repo[] = [
  {
    slug: "agrobot",
    title: "AGROBOT: Automated Seed Sowing Robot",
    summary: "A college project focused on designing and building a cost-effective, automated robot for seed sowing in small-scale agriculture.",
    category: "Hardware · Robotics",
    stack: ["Arduino"],
    timeframe: "Jul 2025",
    repoUrl: "https://github.com/navyyshukla/AGROBOT",
    highlights: [
      "Key Features: Automated Movement: The robot navigates autonomously on the ground. Intelligent Seed Sowing: Utilizes a servo motor for precise seed dispensing.",
      "Tech Stack: Hardware: Arduino Uno, L293D Motor Shield, DC Motors, Servo Motor, HC-SR04 Ultrasonic Sensor, Soil Moisture Sensor, HC-05 Bluetooth Module. Software: C/C++ (in Arduino IDE), Android App for remote control.",
    ],
    keywords: ["agrobot","arduino","ide","motor","seed","automated","robot","sensor","servo","sowing","agriculture","android","autonomously","bluetooth","building","college","control","cost-effective","designing","dispensing"],
  },
  {
    slug: "creatorjoy-ai-pipeline",
    title: "CreatorJoy: Automated AI Avatar Pipeline",
    summary: "This repository contains a fully automated, zero-touch AI video generation pipeline built for CreatorJoy. The architecture programmatically accepts a YouTube video URL and a topic, extracts the creator's thumbnail, generates a custom AI script, clones the creator's voice, and renders a lip-synced MP4 avatar video.",
    category: "Automation · Pipeline",
    stack: ["JavaScript","CSS","HTML","React","Dash","Supabase","PostgreSQL","n8n","Groq"],
    timeframe: "Feb 2026",
    repoUrl: "https://github.com/navyyshukla/CreatorJoy_AI_Pipeline",
    highlights: [
      "Tech Stack & Required APIs: To run this pipeline from A to Z, the following services and API keys were utilized:  n8n: Workflow orchestration and automation. Groq API: Ultra-fast LLM inference (Llama 3 / Mixtral) for script generation.",
      "Architecture: Node-by-Node Breakdown: The backend is driven by a 7-step asynchronous n8n pipeline. You can find the complete workflow in the CreatorJoyAIPipeline.json file included in this repository.",
      "Engineering Edge Cases Handled: Enterprise API Safety Constraints: Built the pipeline to be modular. During testing, enterprise APIs (like D-ID) threw 451 CelebrityDetectedError codes to prevent deepfakes of high-profile tech reviewers.",
    ],
    keywords: ["creatorjoy","pipeline","javascript","css","html","react","dash","supabase","postgresql","n8n","groq","url","api","llm","tts","post","http","get","rls","video","apis","architecture","creator","enterprise","generation","script","tech","workflow","accepts","asynchronous","automated","automation","avatar","backend"],
  },
  {
    slug: "digitrecognition",
    title: "Handwritten Digit Recognition using a CNN",
    summary: "This project showcases a Convolutional Neural Network (CNN) built with TensorFlow and Keras to classify handwritten digits from the MNIST dataset.",
    category: "Machine learning",
    stack: ["Jupyter Notebook","Python","TensorFlow","Keras","CNN","Jupyter"],
    timeframe: "Aug 2025",
    repoUrl: "https://github.com/navyyshukla/DigitRecognition",
    highlights: [
      "Project Summary: Model: A sequential Convolutional Neural Network. This repository provides a comprehensive look at the project, from the initial code to the final documented report.",
    ],
    keywords: ["digitrecognition","jupyter","notebook","python","tensorflow","keras","cnn","mnist","convolutional","network","neural","classify","code","comprehensive","dataset","digits","documented","final","handwritten","initial","look","model","provides","report"],
  },
  {
    slug: "ml-for-nextgen-wireless-networks",
    title: "ML For NextGen Wireless Networks",
    summary: "This repository contains the research paper and associated materials for the project titled: \"Machine Learning-Based Resource Allocation and Offloading Strategies for Next-Generation Satellite-Terrestrial and IRS-Assisted Networks\".",
    category: "Machine learning",
    stack: ["Python","TensorFlow","Machine Learning"],
    timeframe: "Aug 2025",
    repoUrl: "https://github.com/navyyshukla/ML-for-NextGen-Wireless-Networks",
    highlights: [
      "Project Summary: The core of this research is a Deep Q-Network (DQN) agent designed to navigate the intricate trade-offs between energy consumption and latency for multiple users. We developed and simulated a novel, unified framework that combines three key technologies: 1.",
      "Key Features & Contributions: Novel Integration Framework: The research introduces a unified model for a three-component satellite-terrestrial-IRS network, addressing a significant gap in prior studies. Dynamic DRL Solution: A DQN-based agent dynamically allocates resources and manages task offloading decisions to adapt to changing network conditions like user mobility and channel variations.",
    ],
    keywords: ["nextgen","wireless","networks","python","tensorflow","machine","learning","irs","dqn","drl","mec","framework","network","research","agent","core","deep","model","novel","offloading","paper","q-network","satellite-terrestrial","technologies","unified","academic","adapt"],
  },
  {
    slug: "n8n-social-media-pipeline",
    title: "n8n Social Media Pipeline",
    summary: "An automated, end-to-end AI content generation pipeline built with n8n. This workflow takes a simple topic idea, generates a viral-ready Twitter/X thread using Groq's Llama 3.1, logs the data securely in Supabase, and utilizes a dual-channel Discord architecture for team alerts and content delivery.",
    category: "Automation · Pipeline",
    stack: ["Node.js","Supabase","PostgreSQL","n8n","Groq"],
    timeframe: "Feb 2026",
    repoUrl: "https://github.com/navyyshukla/n8n-Social-Media-Pipeline",
    highlights: [
      "Tech Stack & Integrations: n8n: Visual node-based workflow automation (Locally hosted via Node.js/npm). Groq (Llama 3.1 8B): Ultra-fast Large Language Model for content generation.",
      "System Architecture: This pipeline follows a strict Intake Process Log Deliver architecture: 1. Content Intake Form (Frontend): A clean, user-friendly n8n web form that allows team members to submit topic ideas without needing access to the backend.",
    ],
    keywords: ["n8n","social","media","pipeline","node.js","supabase","postgresql","groq","api","json","http","url","content","architecture","form","generation","intake","llama","team","topic","workflow","access","alerts","allows","automated","automation","backend","clean"],
  },
  {
    slug: "portfolio-website",
    title: "This Portfolio Site",
    summary: "The site you are reading, and the assistant answering you. Next.js 16 and React 19, statically generated, with a grounded assistant running on free-tier inference.",
    category: "Full-stack web",
    stack: ["TypeScript","Next.js","React","Tailwind CSS","Three.js","Groq","Gemini","Upstash Redis","Vercel"],
    timeframe: "Jul — Aug 2026",
    repoUrl: "https://github.com/navyyshukla/Portfolio-Website",
    highlights: [
      "Assistant design: Answers are grounded in a corpus built from the site's own content files. There is no vector database and no embedding step — with a corpus this size, the relevant documents are selected by keyword match and pasted into the system prompt.",
      "Working inside a free tier: The primary model allows 100,000 tokens per day, and the corpus is resent on every question, so prompt size is the thing that decides how many visitors can be answered. Only the matching projects are sent, not the whole record.",
      "Guardrails: Scope is enforced by a positive allowlist rather than a keyword blacklist, which over-refuses on real recruiter questions. Visitor input is fenced as data, and requests are rate-limited per IP.",
      "Performance budget: First-load JavaScript on the homepage is held under 200 KB gzipped, which is what keeps Three.js, the chat UI and the markdown renderer behind dynamic imports.",
    ],
    keywords: ["portfolio","website","site","this site","typescript","next.js","nextjs","react","tailwind","three.js","webgl","groq","gemini","llm","assistant","chatbot","rag","retrieval","corpus","prompt","guardrails","rate limit","upstash","redis","vercel","ssg","static","performance","bundle","accessibility","free tier","streaming"],
  },
  {
    slug: "rtsp-overlay-app",
    title: "RTSP Video Overlay App",
    summary: "A full-stack application that plays RTSP/HLS livestreams and allows users to create, position, resize, and delete custom text and image overlays in real time. All overlay configurations are persisted using MongoDB.",
    category: "Full-stack web",
    stack: ["JavaScript","CSS","Python","React","Flask","MongoDB","RTSP","HLS"],
    timeframe: "Jan 2026",
    repoUrl: "https://github.com/navyyshukla/rtsp-overlay-app",
    highlights: [
      "Features: - Live Streaming: HLS playback support for RTSP-compatible streams. - Interactive Overlays: Drag-and-drop positioning, resizing, and styling using react-rnd. - Studio Mode: Full-window playback while maintaining overlay interactivity. - Persistence: Overlay position, size, and style stored in MongoDB. - RESTful CRUD APIs: Create, read, update, and delete overlays.",
      "Tech Stack: - Frontend: React (Vite), Axios, React-RND, HLS.js - Backend: Python Flask - Database: MongoDB - Styling: CSS3 (Glassmorphism and Neon Effects)",
    ],
    keywords: ["rtsp","overlay","javascript","css","python","react","flask","mongodb","hls","crud","rnd","api","get","post","put","delete","url","overlays","create","playback","position","react-rnd","styling","allows","apis","axios","backend","configurations","css3","custom","database"],
  },
];
