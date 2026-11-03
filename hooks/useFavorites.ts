"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isMockMode } from "@/lib/auth/config";

// mock 의 공지 id(1000~)와 실제 DB id 는 서로 무관하다. 같은 브라우저에서 두 모드를
// 오가도 즐겨찾기가 엉뚱한 공지를 가리키지 않게 저장 키를 분리한다. (real 키는 그대로)
const STORAGE_KEY = isMockMode
  ? "skku-notice-favorites:mock"
  : "skku-notice-favorites";
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
