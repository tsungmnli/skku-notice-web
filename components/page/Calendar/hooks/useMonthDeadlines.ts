"use client";

import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "@/lib/api/client";
import type { Article } from "@/lib/api/types";
import { SEOUL_TZ, toSeoulDateStr, todayInSeoul } from "@/utils/date";

type Result = {
  key: string;
  deadlines: Article[];
  error: string | null;
};

/** Fetch all deadlines for a given month, paginating until >50 per page stops or all loaded. */
export function useMonthDeadlines(month: dayjs.Dayjs) {
  const monthKey = month.format("YYYY-MM");
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${monthKey}:${reloadToken}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const target = dayjs(`${monthKey}-01`);
      const start = target.startOf("month").tz(SEOUL_TZ);
      const end = target.endOf("month").tz(SEOUL_TZ);
      const deadlineFrom = toSeoulDateStr(start);
      const deadlineTo = toSeoulDateStr(end);

      try {
        const all: Article[] = [];
        let page = 1;
        // keep fetching until no next page; spec says >50 per page means continue
        while (page <= 20) {
          const res = await api.listArticles({
            has_deadline: true,
            deadline_from: deadlineFrom,
            deadline_to: deadlineTo,
            sort: "deadline_asc",
            page,
            size: 50,
          });
          if (cancelled) return;
          all.push(...res.items);
          if (!res.has_next) break;
          page++;
        }
        if (cancelled) return;
        setResult({ key: requestKey, deadlines: all, error: null });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "오류가 발생했습니다.";
        setResult({ key: requestKey, deadlines: [], error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [monthKey, requestKey]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  // loading is derived: the latest result belongs to a different request
  const loading = result?.key !== requestKey;
  return {
    deadlines: result?.deadlines ?? [],
    loading,
    error: loading ? null : (result?.error ?? null),
    refetch,
  };
}

export function groupByDate(articles: Article[]): Map<string, Article[]> {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    if (!a.deadline_at) continue;
    const dateStr = dayjs.tz(a.deadline_at, SEOUL_TZ).format("YYYY-MM-DD");
    const arr = map.get(dateStr) || [];
    arr.push(a);
    map.set(dateStr, arr);
  }
  return map;
}

export function isToday(date: dayjs.Dayjs): boolean {
  return date.isSame(todayInSeoul(), "day");
}
