"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useAssistant, STARTERS } from "./useAssistant";
import { useSpeech } from "./useSpeech";

/**
 * Docked assistant panel.
 *
 * Deliberately NOT modal: no backdrop, no scroll lock, no focus trap. The
 * research is explicit that a chatbot which takes over the screen reads as
 * intrusive, and that people want to keep reading the page while they ask.
 * You can scroll, click links and navigate with this open.
 *
 * It sits above the dot field (z-index 5) so the texture never washes over the
 * conversation.
 */
export function ChatPopup({ onClose }: { onClose: () => void }) {
  const { messages, isStreaming, error, send, stop } = useAssistant();
  const speech = useSpeech();
  const [input, setInput] = useState("");
  const [wide, setWide] = useState(false);
  const transcript = useRef<HTMLDivElement | null>(null);
  const composer = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    composer.current?.focus();
  }, []);

  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages]);

  // Escape closes, but only when nothing is streaming — otherwise it stops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isStreaming) stop();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isStreaming, onClose, stop]);

  const submit = () => {
    void send(input);
    setInput("");
  };

  return (
    <section
      className={`chat-pop${wide ? " is-wide" : ""}`}
      role="dialog"
      aria-label="Assistant"
    >
      <header className="chat-pop-head">
        <span className="chat-pop-title">
          <span className="chat-dot" aria-hidden="true" />
          Ask about my work
        </span>
        <span className="chat-pop-actions">
          <button
            type="button"
            className="iconbtn"
            onClick={() => setWide((v) => !v)}
            aria-label={wide ? "Shrink the panel" : "Widen the panel"}
            title={wide ? "Shrink" : "Widen"}
          >
            {wide ? "⤡" : "⤢"}
          </button>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close assistant">
            ✕
          </button>
        </span>
      </header>

      <div
        className="chat-pop-body"
        ref={transcript}
        aria-live="polite"
        aria-atomic="false"
        /* Lenis owns wheel events globally; this opts the transcript out so the
           wheel scrolls the chat and never leaks to the page. */
        data-lenis-prevent
      >
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>
              I answer only from what&rsquo;s written on this site. If it isn&rsquo;t
              recorded here, I&rsquo;ll say so rather than guess.
            </p>
            <ul>
              {STARTERS.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => void send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="chat-user">
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="chat-bot">
              <div className="chat-md">
                <ReactMarkdown
                  skipHtml
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
              {m.content && !isStreaming && speech.isAvailable ? (
                <button
                  type="button"
                  className="chat-listen"
                  onClick={() => void speech.speak(m.id, m.content)}
                  aria-pressed={speech.speakingId === m.id}
                >
                  {speech.speakingId === m.id ? "◼ Stop" : "▶ Listen"}
                </button>
              ) : null}
            </div>
          ),
        )}

        {isStreaming && messages[messages.length - 1]?.content === "" ? (
          <p className="chat-thinking">Thinking…</p>
        ) : null}

        {error ? (
          <p className="chat-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="chat-pop-foot"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-pop-input" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="chat-pop-input"
          ref={composer}
          rows={1}
          value={input}
          maxLength={1000}
          placeholder="Ask something…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="submit"
          className="chat-send"
          disabled={isStreaming || input.trim().length === 0}
          aria-label="Send"
        >
          ↑
        </button>
      </form>
    </section>
  );
}
