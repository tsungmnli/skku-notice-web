"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "skku-notice-favorites";
const CHANGE_EVENT = "favorites-changed";
const EMPTY: number[] = [];

function parseIds(raw: string | null): number[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((x): x is number => typeof x === "number");
  } catch {
    return EMPTY;
  }
}

// useSyncExternalStore requires a referentially stable snapshot, so cache the
// parsed array and only re-parse when the raw stored string changes.
let cachedRaw: string | null = null;
let cachedIds: number[] = EMPTY;

function getSnapshot(): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage unavailable
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parseIds(raw);
  }
  return cachedIds;
}

function getServerSnapshot(): number[] {
  return EMPTY;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function writeIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

const noopSubscribe = () => () => {};

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  // false during SSR and the hydration pass, true afterwards
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback((id: number) => {
    const current = getSnapshot();
    writeIds(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }, []);

  const removeFavorite = useCallback((id: number) => {
    writeIds(getSnapshot().filter((x) => x !== id));
  }, []);

  const clearAll = useCallback(() => {
    writeIds([]);
  }, []);

  return {
    favorites,
    hydrated,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearAll,
  };
}
