"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  getRead,
  markRead as storeMarkRead,
  resolveBaseline,
} from "@/lib/reads/store";
import { windowStart, computeSince, badgeFor } from "@/lib/freshness";
import { todayInSeoul } from "@/utils/date";
import type { Article } from "@/lib/api/types";
import { useAuth } from "./useAuth";

const noopSubscribe = () => () => {};

export function useReads() {
  const { status, user } = useAuth();

  // Subscribed only to re-render on store changes; value is read via getRead.
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const isAuthenticated = status === "authenticated";

  const since = useCallback((createdAt: string | null): string => {
    // 렌더 중 호출되므로 저장하지 않는 계산만 한다. 저장은 ReadsSync가 담당.
    const baseline = resolveBaseline(createdAt);
    const ws = windowStart(todayInSeoul());
    return computeSince(ws, baseline);
  }, []);

  const sinceStr = hydrated ? since(user?.created_at ?? null) : "";

  const badgeOf = useCallback(
    (article: Article): "NEW" | "UPDATED" | null => {
      if (!hydrated) return null;
      const read = getRead(article.id);
      return badgeFor(article, read, sinceStr);
    },
    [hydrated, sinceStr],
  );

  const markRead = useCallback(
    (id: number) => {
      if (!hydrated) return;
      storeMarkRead(id, isAuthenticated);
    },
    [hydrated, isAuthenticated],
  );

  return { hydrated, since: sinceStr, badgeOf, markRead };
}
