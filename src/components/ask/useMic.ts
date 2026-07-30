"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Push-to-talk speech input. Deliberately NOT continuous and NOT a wake word —
 * the mic opens on an explicit press and closes on release or result.
 *
 * Privacy: on Chrome/Edge the captured audio is sent to Google's cloud for
 * recognition. The UI must disclose that before the first listen; this hook
 * exposes `needsConsent` so the caller can gate on it. Firefox has
 * SpeechRecognition off by default, so `isAvailable` is false there and the
 * text composer simply remains the only input — voice is never a requirement.
 */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript?: string }>>;
}

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => Recognition)
    | null;
}

/** Capability is an external store — read it, don't mirror it into state. */
const noopSubscribe = () => () => {};
const micSupported = () => getRecognitionCtor() !== null;

const CONSENT_KEY = "ask:mic-consent";

function readConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function useMic(onTranscript: (text: string) => void) {
  const isAvailable = useSyncExternalStore(noopSubscribe, micSupported, () => false);
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onTranscript);

  // Ref writes belong in an effect, never in the render body.
  useEffect(() => {
    callback.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => recognition.current?.abort?.();
  }, []);

  /**
   * Read at click time rather than mirrored into state on mount: consent is
   * only ever needed at the moment the mic is pressed, and reading it lazily
   * avoids both a hydration mismatch and a setState-in-effect.
   */
  const needsConsent = useCallback(() => !readConsent(), []);

  const grantConsent = useCallback(() => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "granted");
    } catch {
      // Private mode — consent just won't persist across reloads.
    }
  }, []);

  const stop = useCallback(() => {
    recognition.current?.stop?.();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || isListening) return;

    const instance = new Ctor();
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.continuous = false;
    instance.maxAlternatives = 1;

    instance.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (typeof transcript === "string") callback.current(transcript);
    };
    instance.onend = () => setIsListening(false);
    instance.onerror = () => setIsListening(false);

    recognition.current = instance;
    instance.start();
    setIsListening(true);
  }, [isListening]);

  return { isAvailable, isListening, needsConsent, grantConsent, start, stop };
}
