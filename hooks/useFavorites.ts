"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "skku-notice-favorites";

function readIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "number");
  } catch {
    return [];
  }
}

function writeIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("favorites-changed"));
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readIds());
    setHydrated(true);

    const handler = () => setFavorites(readIds());
    window.addEventListener("favorites-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("favorites-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback((id: number) => {
    const current = readIds();
    let next: number[];
    if (current.includes(id)) {
      next = current.filter((x) => x !== id);
    } else {
      next = [...current, id];
    }
    writeIds(next);
    setFavorites(next);
  }, []);

  const removeFavorite = useCallback((id: number) => {
    const next = readIds().filter((x) => x !== id);
    writeIds(next);
    setFavorites(next);
  }, []);

  const clearAll = useCallback(() => {
    writeIds([]);
    setFavorites([]);
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
