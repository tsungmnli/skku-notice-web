"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Article, LookupResponse } from "@/lib/api/types";

type State = {
  data: LookupResponse | null;
  loading: boolean;
  error: string | null;
};

export function useFavoritesLookup(ids: number[], ready: boolean) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (ids.length === 0) {
      setState({
        data: { items: [], missing_ids: [] },
        loading: false,
        error: null,
      });
      return;
    }
    setState({ data: null, loading: true, error: null });
    try {
      const data = await api.lookupArticles(ids);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.";
      setState({ data: null, loading: false, error: message });
    }
  }, [JSON.stringify(ids)]);

  useEffect(() => {
    if (ready) fetch();
  }, [fetch, ready]);

  return { ...state, refetch: fetch };
}

export function partitionArticles(data: LookupResponse | null): {
  found: Article[];
  missing: number[];
} {
  if (!data) return { found: [], missing: [] };
  return { found: data.items, missing: data.missing_ids };
}
