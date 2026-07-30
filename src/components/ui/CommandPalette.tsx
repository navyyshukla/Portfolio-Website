"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { projects } from "@/content/projects";

/**
 * The ⌘K palette — dual purpose, Linear/Raycast style: it resolves known intent
 * (navigate to a project) and ambiguous intent (ask a question) in one surface.
 * "Use structured GUI when the user's intent is known, use conversation when
 * intent is ambiguous." See report §3.4.7.
 *
 * This module is only ever reached through next/dynamic from PaletteShim, so
 * neither it nor cmdk appears in the `/` bundle.
 *
 * Note this imports `projects` for the nav list — that is content metadata
 * (titles and slugs), not the corpus. The corpus is server-only and never
 * crosses into a client component.
 */

const PAGES = [
  { label: "Home", href: "/" },
  { label: "Ask the assistant", href: "/ask" },
  { label: "Beyond code", href: "/beyond-code" },
];

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Lock body scroll while the overlay is open, and restore on close.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={onClose}
    >
      <Command
        label="Command palette"
        loop
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Go to a page, or ask a question…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            Press Enter to ask the assistant.
          </Command.Empty>

          <Command.Group
            heading="Go to"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted"
          >
            {PAGES.map((page) => (
              <Command.Item
                key={page.href}
                value={`go ${page.label}`}
                onSelect={() => go(page.href)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[selected=true]:bg-bg"
              >
                {page.label}
              </Command.Item>
            ))}
            {projects.map((project) => (
              <Command.Item
                key={project.slug}
                value={`work ${project.title} ${project.stack.join(" ")}`}
                onSelect={() => go(`/work/${project.slug}`)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[selected=true]:bg-bg"
              >
                Work · {project.title}
              </Command.Item>
            ))}
          </Command.Group>

          {query.trim().length > 0 ? (
            <Command.Group
              heading="Ask"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted"
            >
              <Command.Item
                value={`ask ${query}`}
                forceMount
                onSelect={() => go(`/ask?q=${encodeURIComponent(query.slice(0, 1000))}`)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm data-[selected=true]:bg-bg"
              >
                &ldquo;{query}&rdquo; — ask the assistant
              </Command.Item>
            </Command.Group>
          ) : null}
        </Command.List>
      </Command>
    </div>
  );
}
