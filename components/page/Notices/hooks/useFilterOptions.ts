"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import type { ArticleScope, Category, Writer } from "@/lib/api/types";

export function useFilterOptions(scope?: ArticleScope) {
  const scopeKey = scope ? JSON.stringify(scope) : "";
  const parsedScope = useMemo<ArticleScope | undefined>(
    () => (scopeKey ? JSON.parse(scopeKey) : undefined),
    [scopeKey],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, wrs] = await Promise.all([
          api.listCategories(parsedScope),
          api.listWriters(undefined, 50, parsedScope),
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
  }, [parsedScope]);

  const searchWriters = useCallback(
    async (q: string) => api.listWriters(q, 20, parsedScope),
    [parsedScope],
  );

  return { categories, writers, loading, searchWriters };
}
