"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Category, Writer } from "@/lib/api/types";

export function useFilterOptions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, wrs] = await Promise.all([
          api.listCategories(),
          api.listWriters(undefined, 50),
        ]);
        if (!active) return;
        setCategories(cats);
        setWriters(wrs);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const searchWriters = useCallback(async (q: string) => {
    return api.listWriters(q, 20);
  }, []);

  return { categories, writers, loading, searchWriters };
}
