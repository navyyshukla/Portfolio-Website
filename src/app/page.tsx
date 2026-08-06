import { Hero } from "@/components/sections/Hero";
import { Experience } from "@/components/sections/Experience";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

/**
 * The recruiter path.
 *
 * Linear scroll, no interaction required, nothing personal. Hobbies,
 * extracurriculars and the story path live on /beyond-code and must never be
 * rendered here.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Experience />
      <SelectedWork />
      <Skills />
      <Contact />
    </>
  );
}
