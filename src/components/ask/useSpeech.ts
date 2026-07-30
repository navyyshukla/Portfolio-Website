"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Read-aloud via the browser's `speechSynthesis`. $0, no API, no dependency.
 *
 * Two confirmed bugs are handled here — see report §3.4.8:
 *
 * 1. Chrome silently halts after ~15s on Google-provided voices. The API keeps
 *    reporting `speaking` but no audio comes out. The working fix is pause()
 *    followed by resume() on a 14s interval. Note resume() alone stopped
 *    working; the pause() first is required.
 *
 * 2. getVoices() is synchronous but has an async data dependency — it returns
 *    an empty array on the first call in Chrome. We race `voiceschanged`
 *    against a timeout, because on a platform with no voices installed the
 *    event may never fire at all.
 *
 * Nothing ever speaks without an explicit user gesture (WCAG SC 1.4.2).
 */

const KEEPALIVE_MS = 14_000;
const VOICES_TIMEOUT_MS = 2_000;

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Browser capability is an external store, not React state. Reading it via
 * useSyncExternalStore keeps the server snapshot `false`, so there is no
 * hydration mismatch and no setState-in-effect.
 */
const noopSubscribe = () => () => {};

function useSupported(): boolean {
  return useSyncExternalStore(noopSubscribe, supported, () => false);
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) return immediate;

  return new Promise((resolve) => {
    const done = (value: SpeechSynthesisVoice[]) => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      clearTimeout(timer);
      resolve(value);
    };
    const onChange = () => done(window.speechSynthesis.getVoices());
    const timer = setTimeout(() => done(window.speechSynthesis.getVoices()), VOICES_TIMEOUT_MS);
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
  });
}

export function useSpeech() {
  const isAvailable = useSupported();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (keepAlive.current) clearInterval(keepAlive.current);
      if (supported()) window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (!supported()) return;
    if (keepAlive.current) {
      clearInterval(keepAlive.current);
      keepAlive.current = null;
    }
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      if (!supported() || text.trim().length === 0) return;

      // Toggle: pressing Listen on the answer already speaking stops it.
      if (speakingId === id) {
        stop();
        return;
      }
      stop();

      const voices = await loadVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      const preferred = voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred?.lang ?? "en-US";
      // Values above 2 break on all Chrome; stay at 1.
      utterance.rate = 1;

      utterance.onstart = () => {
        setSpeakingId(id);
        keepAlive.current = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            if (keepAlive.current) clearInterval(keepAlive.current);
            keepAlive.current = null;
            return;
          }
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, KEEPALIVE_MS);
      };

      const finish = () => {
        if (keepAlive.current) clearInterval(keepAlive.current);
        keepAlive.current = null;
        setSpeakingId(null);
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    },
    [speakingId, stop],
  );

  return { isAvailable, speakingId, speak, stop };
}
