"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArticleQuery, PinnedFilter, SortKey } from "@/lib/api/types";
import { getDueRange, isIsoDate, isQuickDueKey } from "@/utils/date";
import { MAX_PAGE, SEARCH_MAX_LENGTH, SORT_LABELS } from "@/utils/constants";

// 북마크·공유 링크의 값은 사용자가 손댈 수 있다. 서버가 422 로 거절할 값은 여기서 걸러 낸다.
const SORT_KEYS = Object.keys(SORT_LABELS);

export function useNoticeQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dueParam = searchParams.get("due");
  const due = isQuickDueKey(dueParam) ? dueParam : null;

  const query = useMemo<ArticleQuery>(() => {
    const q: ArticleQuery = {};
    const searchQ = searchParams.get("q");
    if (searchQ) q.q = searchQ.slice(0, SEARCH_MAX_LENGTH);

    const categories = searchParams.getAll("category");
    if (categories.length) q.category = categories;

    const writers = searchParams.getAll("writer");
    if (writers.length) q.writer = writers;

    const dateFrom = searchParams.get("date_from");
    if (dateFrom && isIsoDate(dateFrom)) q.date_from = dateFrom;
    const dateTo = searchParams.get("date_to");
    if (dateTo && isIsoDate(dateTo)) q.date_to = dateTo;

    // 빠른 마감 기간: URL에는 키(`due`)만 저장하고, 실제 날짜 범위는 여기서 계산한다.
    // 공유/북마크한 링크도 항상 "열린 날 기준"으로 해석된다.
    if (due) {
      const range = getDueRange(due);
      q.deadline_from = range.from;
      q.deadline_to = range.to;
    }

    const pinned = searchParams.get("pinned");
    if (pinned === "include" || pinned === "exclude" || pinned === "only") {
      q.pinned = pinned as PinnedFilter;
    }

    const hasDeadline = searchParams.get("has_deadline");
    if (hasDeadline === "true") q.has_deadline = true;

    const sort = searchParams.get("sort");
    if (sort && SORT_KEYS.includes(sort)) q.sort = sort as SortKey;

    const page = parseInt(searchParams.get("page") ?? "", 10);
    q.page = Number.isFinite(page) ? Math.min(Math.max(page, 1), MAX_PAGE) : 1;

    q.size = 20;
    return q;
  }, [searchParams, due]);

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

  return { query, due, updateQuery };
}
