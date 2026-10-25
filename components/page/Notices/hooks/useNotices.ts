"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { ArticleListResponse, ArticleQuery } from "@/lib/api/types";

type State = {
  data: ArticleListResponse | null;
  loading: boolean;
  error: string | null;
};

export function useNotices(query: ArticleQuery) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });
  const reqIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.listArticles(query);
      if (reqId !== reqIdRef.current) return;
      setState({ data, loading: false, error: null });
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setState({ data: null, loading: false, error: message });
    }
  }, [JSON.stringify(query)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
