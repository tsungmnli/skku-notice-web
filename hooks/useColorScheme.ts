"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "skku-color-scheme";
const CHANGE_EVENT = "skku-color-scheme-changed";

type Scheme = "light" | "dark";

function getSnapshot(): Scheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // storage unavailable
  }
  return null;
}

function getServerSnapshot(): Scheme | null {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useColorSchemeState() {
  const scheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    const prev = getSnapshot();
    const next: Scheme =
      prev === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "light"
          : "dark"
        : prev === "dark"
          ? "light"
          : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { scheme, toggle };
}
