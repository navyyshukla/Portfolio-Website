/** Work history and education. Bullets should describe impact, not duties. */

export interface ExperienceItem {
  role: string;
  organisation: string;
  timeframe: string;
  /** Impact-first. Numbers where you have them. */
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
  // TODO(content): real roles, internships, or significant open-source work.
  {
    role: "TODO: Role",
    organisation: "TODO: Company",
    timeframe: "TODO",
    bullets: [
      "TODO: What you changed and what it produced.",
      "TODO: A specific technical decision you made.",
    ],
    stack: ["TODO"],
  },
];

export const education: EducationItem[] = [
  // TODO(content)
  {
    qualification: "TODO: Degree",
    institution: "TODO: Institution",
    timeframe: "TODO",
  },
];
