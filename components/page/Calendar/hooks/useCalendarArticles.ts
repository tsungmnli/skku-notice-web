"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { api } from "@/lib/api/client";
import type { Article } from "@/lib/api/types";
import { todayInSeoul, toSeoulDateStr } from "@/utils/date";

export type Window = {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
};

type State = {
  articles: Article[];
  loading: boolean;
  error: string | null;
};

const INITIAL_DAYS = 30;
const EXTEND_DAYS = 30;

function toISODate(d: dayjs.Dayjs): string {
  return toSeoulDateStr(d);
}

export function useCalendarArticles() {
  const today = useMemo(() => todayInSeoul().startOf("day"), []);
  const [window, setWindow] = useState<Window>(() => ({
    from: today,
    to: today.add(INITIAL_DAYS - 1, "day"),
  }));
  const [state, setState] = useState<State>({
    articles: [],
    loading: true,
    error: null,
  });
  const reqKeyRef = useRef("");

  useEffect(() => {
    const reqKey = `${toISODate(window.from)}:${toISODate(window.to)}`;
    reqKeyRef.current = reqKey;
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const all: Article[] = [];
        let page = 1;
        while (page <= 20) {
          const res = await api.listArticles({
            has_deadline: true,
            deadline_from: toISODate(window.from),
            deadline_to: toISODate(window.to),
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
        if (reqKeyRef.current !== reqKey) return;
        setState({ articles: all, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        if (reqKeyRef.current !== reqKey) return;
        const message =
          err instanceof Error ? err.message : "마감 공지를 불러오지 못했습니다.";
        setState({ articles: [], loading: false, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [window.from, window.to]);

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
    loading: state.loading,
    error: state.error,
    window,
    loadMore,
    loadPast,
    jumpToDate,
    backToToday,
    hasPast,
  };
}
