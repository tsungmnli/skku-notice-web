"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Article, LookupResponse } from "@/lib/api/types";

type Result = {
  key: string;
  data: LookupResponse | null;
  error: string | null;
};

const EMPTY_LOOKUP: LookupResponse = { items: [], missing_ids: [] };

export function useFavoritesLookup(ids: number[], ready: boolean) {
  const idsKey = JSON.stringify(ids);
  const isEmpty = ids.length === 0;
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${idsKey}:${reloadToken}`;

  useEffect(() => {
    if (!ready || isEmpty) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await api.lookupArticles(JSON.parse(idsKey));
        if (cancelled) return;
        setResult({ key: requestKey, data, error: null });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.";
        setResult({ key: requestKey, data: null, error: message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, isEmpty, idsKey, requestKey]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  if (!ready) {
    return { data: null, loading: true, error: null, refetch };
  }
  if (isEmpty) {
    return { data: EMPTY_LOOKUP, loading: false, error: null, refetch };
  }
  // loading is derived: the latest result belongs to a different request
  const current = result?.key === requestKey ? result : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
    refetch,
  };
}

export function partitionArticles(data: LookupResponse | null): {
  found: Article[];
  missing: number[];
} {
  if (!data) return { found: [], missing: [] };
  return { found: data.items, missing: data.missing_ids };
}
