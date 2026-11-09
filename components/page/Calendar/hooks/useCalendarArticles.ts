"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { api } from "@/lib/api/client";
import type { Article, ArticleScope } from "@/lib/api/types";
import { todayInSeoul, toSeoulDateStr } from "@/utils/date";

export type Window = {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
};

type State = {
  articles: Article[];
  deptIdSet: Set<number>;
  campusCount: number;
  deptCount: number;
  loading: boolean;
  error: string | null;
  deptError: string | null;
  campusError: string | null;
};

const INITIAL_DAYS = 30;
const EXTEND_DAYS = 30;

function toISODate(d: dayjs.Dayjs): string {
  return toSeoulDateStr(d);
}

async function fetchDeadlinePage(
  windowFrom: dayjs.Dayjs,
  windowTo: dayjs.Dayjs,
  page: number,
  scope?: ArticleScope,
): Promise<Article[]> {
  const res = await api.listArticles({
    has_deadline: true,
    deadline_from: toISODate(windowFrom),
    deadline_to: toISODate(windowTo),
    sort: "deadline_asc",
    page,
    size: 50,
    ...(scope ?? {}),
  });
  return res.items;
}

async function fetchAllDeadlines(
  windowFrom: dayjs.Dayjs,
  windowTo: dayjs.Dayjs,
  scope?: ArticleScope,
  signal?: { cancelled: boolean },
): Promise<Article[]> {
  const all: Article[] = [];
  let page = 1;
  while (page <= 20) {
    const items = await fetchDeadlinePage(windowFrom, windowTo, page, scope);
    if (signal?.cancelled) return all;
    all.push(...items);
    if (items.length < 50) break;
    page++;
  }
  return all;
}

export function useCalendarArticles(
  scope?: ArticleScope,
  scopeEnabled?: boolean,
) {
  const today = useMemo(() => todayInSeoul().startOf("day"), []);
  const [window, setWindow] = useState<Window>(() => ({
    from: today,
    to: today.add(INITIAL_DAYS - 1, "day"),
  }));
  const [state, setState] = useState<State>({
    articles: [],
    deptIdSet: new Set(),
    campusCount: 0,
    deptCount: 0,
    loading: true,
    error: null,
    deptError: null,
    campusError: null,
  });
  const reqKeyRef = useRef("");

  // Build a stable string key from the scope so the effect re-fires when it changes
  const scopeKey = useMemo(() => {
    if (!scopeEnabled || !scope) return "none";
    const d = scope.department ?? [];
    const s = scope.source ?? [];
    return `d:${d.join(",")};s:${s.join(",")}`;
  }, [scope, scopeEnabled]);

  useEffect(() => {
    const reqKey = `${toISODate(window.from)}:${toISODate(window.to)}:${scopeKey}`;
    reqKeyRef.current = reqKey;
    let cancelled = false;
    const signal = { cancelled: false };

    (async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        deptError: null,
        campusError: null,
      }));

      const hasDeptScope = scopeEnabled && scope !== undefined;

      const tasks: Promise<{
        articles: Article[];
        error: string | null;
        tag: "campus" | "dept";
      }>[] = [
        (async () => {
          try {
            const items = await fetchAllDeadlines(
              window.from,
              window.to,
              undefined,
              signal,
            );
            return { articles: items, error: null, tag: "campus" as const };
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "마감 공지를 불러오지 못했습니다.";
            return { articles: [], error: message, tag: "campus" as const };
          }
        })(),
      ];

      if (hasDeptScope) {
        tasks.push(
          (async () => {
            try {
              const items = await fetchAllDeadlines(
                window.from,
                window.to,
                scope,
                signal,
              );
              return { articles: items, error: null, tag: "dept" as const };
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "학과 마감 공지를 불러오지 못했습니다.";
              return { articles: [], error: message, tag: "dept" as const };
            }
          })(),
        );
      }

      const results = await Promise.all(tasks);
      if (cancelled) return;
      if (reqKeyRef.current !== reqKey) return;

      const campusResult = results.find((r) => r.tag === "campus");
      const deptResult = results.find((r) => r.tag === "dept");

      const campusArticles = campusResult?.articles ?? [];
      const deptArticles = deptResult?.articles ?? [];
      const campusError = campusResult?.error ?? null;
      const deptError = deptResult?.error ?? null;

      // Merge: campus first, then dept, de-dup by id (dept wins → mark as dept)
      const seen = new Set<number>();
      const merged: Article[] = [];
      const deptIdSet = new Set<number>();

      for (const a of deptArticles) {
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        deptIdSet.add(a.id);
        merged.push(a);
      }
      for (const a of campusArticles) {
        if (seen.has(a.id)) {
          // Already present via dept — mark it as dept
          deptIdSet.add(a.id);
          continue;
        }
        seen.add(a.id);
        merged.push(a);
      }

      merged.sort((a, b) => {
        const da = a.deadline_at ?? "";
        const db = b.deadline_at ?? "";
        return da.localeCompare(db);
      });

      const bothErrors =
        campusError && (hasDeptScope ? deptError : campusError);

      setState({
        articles: merged,
        deptIdSet,
        campusCount: campusArticles.length,
        deptCount: deptArticles.length,
        loading: false,
        error: bothErrors ? campusError : null,
        deptError: hasDeptScope ? deptError : null,
        campusError,
      });
    })();

    return () => {
      cancelled = true;
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.from, window.to, scopeKey]);

  const loadMore = useCallback(() => {
    setWindow((prev) => ({
      from: prev.from,
      to: prev.to.add(EXTEND_DAYS, "day"),
    }));
  }, []);

  const loadPast = useCallback(() => {
    setWindow((prev) => ({
      from: prev.from.subtract(EXTEND_DAYS, "day"),
      to: prev.to,
    }));
  }, []);

  const jumpToDate = useCallback((date: dayjs.Dayjs) => {
    const d = date.startOf("day");
    setWindow({ from: d, to: d.add(INITIAL_DAYS - 1, "day") });
  }, []);

  const backToToday = useCallback(() => {
    const t = todayInSeoul().startOf("day");
    setWindow({ from: t, to: t.add(INITIAL_DAYS - 1, "day") });
  }, []);

  const hasPast = window.from.isAfter(today, "day");

  return {
    articles: state.articles,
    deptIdSet: state.deptIdSet,
    campusCount: state.campusCount,
    deptCount: state.deptCount,
    loading: state.loading,
    error: state.error,
    deptError: state.deptError,
    campusError: state.campusError,
    window,
    loadMore,
    loadPast,
    jumpToDate,
    backToToday,
    hasPast,
  };
}
