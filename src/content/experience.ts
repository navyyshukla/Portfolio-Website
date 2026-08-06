/** Work history and education — one continuous track record, newest first. */

export interface ExperienceItem {
  role: string;
  organisation: string;
  timeframe: string;
  /** Shows a "Now" marker on the timeline. */
  current?: boolean;
  location?: string;
  /** Impact first, duties never. */
  bullets: string[];
  stack: string[];
}

export interface EducationItem {
  qualification: string;
  institution: string;
  timeframe: string;
  detail?: string;
}

export const experience: ExperienceItem[] = [
  {
    role: "Software Engineer",
    organisation: "CreatorJoy.com",
    timeframe: "Jan 2026 — Jun 2026",
    location: "Remote",
    bullets: [
      "Sole owner of AirClone's frontend architecture; migrated onboarding off Supabase Edge Functions, n8n and Realtime onto a REST + BFF proxy layer.",
      "Diagnosed a race condition double-triggering the AI pipeline, which was wasting paid calls to two AI providers every session; fixed it with a ref-based idempotency guard.",
      "Implemented a Tyk API Gateway as a single trust boundary — validating sessions and injecting signed identity headers, isolating every microservice and credential from direct client access.",
      "Designed the client-side caching strategy with TanStack Query: structured query keys enable targeted invalidation, so profile mutations auto-refetch dependent auth state instantly.",
      "Built a Backend-for-Frontend proxy enforcing gateway-only access across three backend services via httpOnly cookies, and fixed a CI/CD secret-mapping defect in GCP Secret Manager.",
    ],
    stack: [
      "TypeScript",
      "Next.js",
      "Python",
      "TanStack Query",
      "Supabase (PostgreSQL)",
      "Tyk API Gateway",
      "GCP Cloud Run",
      "GitHub Actions",
    ],
  },
  {
    role: "QA Engineering Intern",
    organisation: "Ethara AI",
    timeframe: "Nov 2025 — Jan 2026",
    location: "Remote",
    bullets: [
      "Ran manual quality checks on AI outputs for accuracy, relevance and consistency.",
      "Documented bugs and anomalies clearly, improving product quality and response reliability.",
      "Reviewed test results with the team and helped refine the QA process itself.",
    ],
    stack: ["Notion", "Jira", "Loom", "Slack", "Google Sheets"],
  },
];

export const education: EducationItem[] = [
  {
    qualification: "B.E. in Electronics and Telecommunication",
    institution: "BMS College of Engineering",
    timeframe: "2022 — 2026",
    detail: "Bengaluru",
  },
  {
    qualification: "Class XII (PCM) and Class X",
    institution: "Delhi Public School, Bhilai",
    timeframe: "2020 — 2022",
    // No extracurriculars here — the football captaincy lives on /beyond-code,
    // per the rule that nothing personal renders on "/".
    detail: "Bhilai",
  },
];
