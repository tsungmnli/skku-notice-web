"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArticleQuery, PinnedFilter, SortKey } from "@/lib/api/types";

export function useNoticeQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo<ArticleQuery>(() => {
    const q: ArticleQuery = {};
    const searchQ = searchParams.get("q");
    if (searchQ) q.q = searchQ;

    const categories = searchParams.getAll("category");
    if (categories.length) q.category = categories;

    const writers = searchParams.getAll("writer");
    if (writers.length) q.writer = writers;

    const dateFrom = searchParams.get("date_from");
    if (dateFrom) q.date_from = dateFrom;
    const dateTo = searchParams.get("date_to");
    if (dateTo) q.date_to = dateTo;

    const pinned = searchParams.get("pinned");
    if (pinned === "include" || pinned === "exclude" || pinned === "only") {
      q.pinned = pinned as PinnedFilter;
    }

    const hasDeadline = searchParams.get("has_deadline");
    if (hasDeadline === "true") q.has_deadline = true;

    const sort = searchParams.get("sort");
    if (sort) q.sort = sort as SortKey;

    const page = searchParams.get("page");
    if (page) q.page = parseInt(page, 10) || 1;
    else q.page = 1;

    q.size = 20;
    return q;
  }, [searchParams]);

  const updateQuery = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          for (const v of value) params.append(key, v);
        } else {
          params.set(key, value);
        }
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { query, updateQuery };
}
