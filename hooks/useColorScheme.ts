"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "skku-color-scheme";

type Scheme = "light" | "dark";

function getInitial(): Scheme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

export function useColorSchemeState() {
  const [scheme, setScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    setScheme(getInitial());
  }, []);

  const toggle = () => {
    setScheme((prev) => {
      const next: Scheme =
        prev === null
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "light"
            : "dark"
          : prev === "dark"
            ? "light"
            : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return { scheme, toggle };
}
