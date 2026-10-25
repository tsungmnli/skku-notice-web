"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ArticleListResponse, ArticleQuery } from "@/lib/api/types";

type Result = {
  key: string;
  data: ArticleListResponse | null;
  error: string | null;
};

export function useNotices(query: ArticleQuery) {
  const queryKey = JSON.stringify(query);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [lastData, setLastData] = useState<ArticleListResponse | null>(null);
  const requestKey = `${queryKey}:${reloadToken}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.listArticles(JSON.parse(queryKey));
        if (cancelled) return;
        setResult({ key: requestKey, data, error: null });
        setLastData(data);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setResult({ key: requestKey, data: null, error: message });
        setLastData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryKey, requestKey]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  // loading is derived: the latest result belongs to a different request.
  // The previous page's data stays visible while the next one loads.
  const loading = result?.key !== requestKey;
  return {
    data: lastData,
    loading,
    error: loading ? null : (result?.error ?? null),
    refetch,
  };
}
