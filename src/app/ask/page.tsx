import type { Metadata } from "next";
import { AskConsole } from "@/components/ask/AskConsole";
import { profile } from "@/content/profile";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ask",
  description: `Ask questions about ${profile.name}'s experience, projects and technical decisions. Answers are grounded in this site's content.`,
  path: "/ask",
});

/**
 * The assistant lives here — a real, linkable, indexable page rather than a
 * floating widget. `/` is untouched and still answers every recruiter question
 * with zero interaction; this is the destination for the visitor who wants to
 * interrogate the material.
 *
 * All chat, markdown and voice code is in this route's chunks and cannot reach
 * the `/` bundle.
 */
export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-16">
      <h1 className="text-3xl font-semibold tracking-tight">Ask about my work</h1>
      <p className="mt-4 leading-relaxed text-muted">
        This assistant answers only from what is written on this site — experience,
        projects, skills and the decisions behind them. If something is not
        recorded here it will say so rather than guess. For anything else,{" "}
        <a
          href={`mailto:${profile.email}`}
          className="underline underline-offset-4 hover:text-accent"
        >
          email me
        </a>
        .
      </p>

      {/* The ?q= seed is read client-side, so this page stays static. */}
      <AskConsole />
    </div>
  );
}
