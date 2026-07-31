"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Shared chat transport for both the popup and the /ask page, so there is one
 * implementation of the streaming contract rather than two that drift.
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMessage: Message = { id: `u${Date.now()}`, role: "user", content: trimmed };
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
    [isStreaming, messages],
  );

  return { messages, isStreaming, error, send, stop };
}

export const STARTERS = [
  "What has he actually shipped?",
  "Walk me through his hardest technical decision.",
  "What's his backend experience?",
];
