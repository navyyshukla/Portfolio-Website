import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { BackButton } from "@/components/ui/BackButton";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Résumé",
  description: `${profile.name} — résumé. ${profile.positioning}`,
  path: "/resume",
});

/**
 * The résumé stays on the site rather than dumping the visitor into a bare PDF
 * tab. The file is embedded, with a download link for anyone who wants the
 * actual document and a back control that restores where they came from.
 */
export default function ResumePage() {
  return (
    <div className="wrap resume-page">
      <div className="resume-head">
        <div>
          <p className="eyebrow eyebrow--accent">Résumé</p>
          <h1>{profile.name}</h1>
        </div>
        <div className="resume-actions">
          <BackButton />
          <a
            className="btn btn-primary"
            href={profile.resumeHref}
            download
            aria-label="Download the résumé as a PDF"
          >
            Download PDF ↓
          </a>
        </div>
      </div>

      <div className="resume-frame">
        <object data={profile.resumeHref} type="application/pdf" aria-label="Résumé">
          {/* Shown when the browser cannot render a PDF inline — mobile Safari,
              mostly. Never leaves the visitor with a blank box. */}
          <div className="resume-fallback">
            <p>Your browser can&rsquo;t display the PDF inline.</p>
            <a className="btn btn-primary" href={profile.resumeHref} download>
              Download the résumé ↓
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}
