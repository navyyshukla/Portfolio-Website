/**
 * Skills, grouped. This section exists for keyword screening — keep it honest
 * and scannable. No percentage bars, no star ratings.
 */

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["TypeScript", "Python", "JavaScript", "SQL", "C/C++", "HTML/CSS"],
  },
  {
    label: "Frameworks",
    items: [
      "React",
      "Next.js",
      "Node.js",
      "TanStack Query",
      "Tailwind CSS",
      "FastAPI",
      "Flask",
      "TensorFlow (Keras)",
      "Scikit-learn",
    ],
  },
  {
    label: "Infrastructure",
    items: ["Docker", "Kubernetes", "Google Cloud Platform", "AWS", "Tyk API Gateway"],
  },
  {
    label: "Tools",
    items: ["Git", "GitHub Actions", "Supabase", "Jira", "Notion"],
  },
];
