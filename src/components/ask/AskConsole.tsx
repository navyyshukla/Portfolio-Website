"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useSpeech } from "./useSpeech";
import { useMic } from "./useMic";

/**
 * The assistant console. Lives only on /ask — never imported by `/`.
 *
 * Presentation follows the current convention for serious AI chat: full-width
 * messages with subtle background differentiation, NOT SMS-style bubbles, which
 * "signal casual texting and undermine the tool framing". See report §3.4.7.
 *
 * Markdown renders through rehype-sanitize with skipHtml, so no model-emitted
 * HTML or javascript: URL can reach the DOM. That safety is structural, not
 * prompted, and therefore not bypassable by injection.
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What has he actually shipped?",
  "Walk me through his hardest technical decision.",
  "What's his backend experience?",
  "What does he do outside work?",
];

export function AskConsole() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMicNotice, setShowMicNotice] = useState(false);

  const abort = useRef<AbortController | null>(null);
  const transcript = useRef<HTMLDivElement | null>(null);
  const composer = useRef<HTMLTextAreaElement | null>(null);

  const speech = useSpeech();
  const mic = useMic((text) => {
    setInput((current) => (current ? `${current} ${text}` : text));
    composer.current?.focus();
  });

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setInput("");
      speech.stop();

      const userMessage: Message = {
        id: `u${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const answerId = `a${Date.now()}`;
      const history = [...messages, userMessage];
      setMessages([...history, { id: answerId, role: "assistant", content: "" }]);
      setIsStreaming(true);

      const controller = new AbortController();
      abort.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "The assistant could not answer just now.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages((current) =>
            current.map((m) => (m.id === answerId ? { ...m, content: answer } : m)),
          );
        }
      } catch (caught) {
        if ((caught as Error).name === "AbortError") return;
        setError((caught as Error).message);
        setMessages((current) => current.filter((m) => m.id !== answerId));
      } finally {
        setIsStreaming(false);
        abort.current = null;
      }
    },
    [isStreaming, messages, speech],
  );

  // Seed from the ?q= deep link the command palette produces. Read here rather
  // than via server-side searchParams so /ask stays static and prerendered.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    // Deferred past commit: `send` sets state synchronously before its first
    // await, and kicking that off inside the effect body would cascade.
    if (q) queueMicrotask(() => void send(q.slice(0, 1000)));
  }, [send]);

  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages]);

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void send(input);
    } else if (event.key === "Escape" && isStreaming) {
      abort.current?.abort();
      setIsStreaming(false);
    }
  }

  function onMicPress() {
    if (mic.isListening) {
      mic.stop();
    } else if (mic.needsConsent()) {
      setShowMicNotice(true);
    } else {
      mic.start();
    }
  }

  return (
    <div className="mt-8">
      {messages.length === 0 ? (
        <ul className="mb-6 flex flex-wrap gap-2">
          {STARTERS.map((starter) => (
            <li key={starter}>
              <button
                type="button"
                onClick={() => void send(starter)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-fg"
              >
                {starter}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        ref={transcript}
        aria-live="polite"
        aria-atomic="false"
        aria-label="Conversation"
        className="max-h-[55vh] space-y-6 overflow-y-auto"
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="border-l-2 border-accent pl-4">
              <p className="text-xs uppercase tracking-widest text-muted">You</p>
              <p className="mt-1 leading-relaxed">{message.content}</p>
            </div>
          ) : (
            <div key={message.id} className="rounded-lg bg-surface p-5">
              <p className="text-xs uppercase tracking-widest text-muted">Assistant</p>
              <div className="prose-sm mt-2 space-y-3 leading-relaxed [&_a]:underline [&_li]:ml-4 [&_li]:list-disc">
                <ReactMarkdown
                  skipHtml
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.content && !isStreaming ? (
                <div className="mt-4 flex gap-3">
                  {speech.isAvailable ? (
                    <button
                      type="button"
                      onClick={() => void speech.speak(message.id, message.content)}
                      aria-pressed={speech.speakingId === message.id}
                      className="text-xs text-muted hover:text-fg"
                    >
                      {speech.speakingId === message.id ? "◼ Stop" : "▶ Listen"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(message.content)}
                    className="text-xs text-muted hover:text-fg"
                  >
                    Copy
                  </button>
                </div>
              ) : null}
            </div>
          ),
        )}
        {isStreaming && messages[messages.length - 1]?.content === "" ? (
          <p className="text-sm text-muted">Thinking…</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-border bg-surface p-4 text-sm">
          {error}
        </p>
      ) : null}

      {showMicNotice ? (
        <div className="mt-4 rounded-md border border-border bg-surface p-4 text-sm">
          <p className="text-muted">
            Speech recognition is handled by your browser. On Chrome and Edge that
            means the audio is sent to Google for transcription. Nothing is stored
            by this site.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => {
                mic.grantConsent();
                setShowMicNotice(false);
                mic.start();
              }}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setShowMicNotice(false)}
              className="text-xs text-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="ask-input"
          ref={composer}
          rows={2}
          value={input}
          maxLength={1000}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about experience, projects, or how something was built…"
          className="w-full resize-none rounded-lg border border-border bg-surface p-4 text-sm outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            <kbd className="font-mono">⌘</kbd>+<kbd className="font-mono">Enter</kbd> to send
            {isStreaming ? " · Esc to stop" : null}
          </p>
          <div className="flex gap-2">
            {mic.isAvailable ? (
              <button
                type="button"
                onClick={onMicPress}
                aria-pressed={mic.isListening}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent"
              >
                {mic.isListening ? "◼ Listening" : "🎤 Speak"}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isStreaming || input.trim().length === 0}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-bg disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
