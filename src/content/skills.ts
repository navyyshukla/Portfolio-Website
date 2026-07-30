/**
 * Skills, grouped.
 *
 * This section exists for keyword screening. Keep it honest and scannable —
 * no percentage bars, no star ratings. Nobody believes them.
 */

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  // TODO(content): real groups and items.
  { label: "Languages", items: ["TODO"] },
  { label: "Frameworks", items: ["TODO"] },
  { label: "Infrastructure", items: ["TODO"] },
  { label: "Tools", items: ["TODO"] },
];
