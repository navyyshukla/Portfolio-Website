"use client";

import { useRouter } from "next/navigation";

/**
 * Returns the visitor to exactly where they were.
 *
 * `router.back()` is the only thing that restores scroll position and page
 * state — a Link to "/" would rebuild the homepage at the top. If there is no
 * in-app history (someone opened /resume directly, or from a shared link),
 * fall back to pushing home so the button is never a dead end.
 */
export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  const goBack = () => {
    const cameFromThisSite =
      typeof document !== "undefined" &&
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin;

    if (cameFromThisSite || window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <button type="button" className="btn btn-ghost" onClick={goBack}>
      ← {label}
    </button>
  );
}
