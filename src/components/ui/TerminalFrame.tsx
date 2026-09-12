/**
 * A terminal window, for projects whose output *is* the demo.
 *
 * Margin is a command-line tool. Framing it in browser chrome would claim a web
 * app that does not exist, and a generated cover would say nothing about what
 * it does — but its compressed output is legible at a glance and makes the
 * point on its own.
 *
 * Shares the `.bframe` chrome with `BrowserFrame` deliberately: same border,
 * same dots, same hover treatment from the parent `.work-row`. Only the bar's
 * contents and the screen differ, so a card carrying one of these still reads
 * as a sibling of the screenshot cards rather than a different design.
 */

import type { ProjectTerminal } from "@/content/projects";

export default function TerminalFrame({
  terminal,
  hero = false,
}: {
  terminal: ProjectTerminal;
  /** On a case-study page the frame is the subject, not a teaser. */
  hero?: boolean;
}) {
  return (
    <div className={`bframe bframe--term${hero ? " bframe--termhero" : ""}`}>
      <div className="bframe-bar">
        <div className="bframe-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="bframe-url">{terminal.title}</span>
      </div>
      {/*
        The sample is decorative detail at card size — the alt text carries the
        meaning, so screen readers get the sentence rather than the ASCII.
      */}
      <div className="bframe-term-screen" role="img" aria-label={terminal.alt}>
        <pre aria-hidden="true">
          {terminal.lines.map((line, i) => (
            <span
              key={i}
              className={
                line.startsWith("$")
                  ? "term-cmd"
                  : line.startsWith("#")
                    ? "term-note"
                    : undefined
              }
            >
              {line || " "}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
