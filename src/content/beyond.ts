/**
 * Everything that is not the job search: hobbies, free time, extracurriculars,
 * and the life-story path.
 *
 * This content renders ONLY on /beyond-code. It must never appear on "/".
 */

export interface BeyondEntry {
  title: string;
  kind: string;
  body: string;
}

/** One milestone on the story path. Oldest first. */
export interface StoryStage {
  year: string;
  title: string;
  detail?: string;
}

export interface BeyondContent {
  intro: string;
  entries: BeyondEntry[];
  story: {
    title: string;
    blurb: string;
    reducedMotionNote: string;
    stages: StoryStage[];
  };
}

export const beyond: BeyondContent = {
  intro:
    "The parts that have nothing to do with a job title — what I read, what I watch, and where I've been.",
  entries: [
    {
      title: "Reading",
      kind: "Hobby",
      body: "Articles and books, fairly indiscriminately. It is where most of the questioning starts.",
    },
    {
      title: "Watching sport like a nerd",
      kind: "Hobby",
      body: "Football, Formula 1 and cricket — less for the result than for how the thing was won.",
    },
    {
      title: "Travelling",
      kind: "Free time",
      body: "Mostly an excuse to spend proper time with friends and family.",
    },
    {
      title: "Exploring new software",
      kind: "Hobby",
      body: "Trying whatever has just shipped, to see how other people solved the problem.",
    },
    {
      title: "Football captain, DPS Bhilai",
      kind: "Extracurricular",
      body: "Captained the school football team.",
    },
  ],
  story: {
    title: "My story, as a path",
    blurb:
      "A path of milestones from where it started to where things stand now. Press next and the character walks on, growing as the years go by. Entirely optional.",
    reducedMotionNote:
      "This uses motion. You have reduced motion enabled, so the character moves between stages instantly instead of walking.",
    stages: [
      { year: "2004", title: "Born in Chhattisgarh" },
      { year: "2008", title: "Joined Delhi Public School, Bhilai" },
      { year: "2014", title: "Became a school appointee", detail: "In class 5." },
      { year: "2018", title: "Made football team captain" },
      { year: "2022", title: "Finished school at DPS Bhilai" },
      { year: "2022", title: "Joined BMS College of Engineering" },
      { year: "2026", title: "Joined CreatorJoy.com as a Software Engineer" },
      { year: "2026", title: "Graduated from BMS College of Engineering" },
    ],
  },
};
