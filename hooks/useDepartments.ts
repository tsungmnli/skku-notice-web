"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import type { Department } from "@/lib/api/types";

type Cache = {
  departments: Department[];
  colleges: Map<string, Department>;
  fetchedAt: number;
};

const TTL = 60_000;
let cache: Cache | null = null;

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(
    cache?.departments ?? [],
  );
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial state is already seeded from a fresh cache.
    if (cache && Date.now() - cache.fetchedAt < TTL) return;

    let cancelled = false;

    void (async () => {
      try {
        const depts = await api.listDepartments();
        if (cancelled) return;
        const colleges = new Map<string, Department>();
        for (const d of depts) {
          if (d.kind === "college") colleges.set(d.code, d);
        }
        cache = { departments: depts, colleges, fetchedAt: Date.now() };
        setDepartments(depts);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "학과 목록을 불러오지 못했습니다.";
        setError(message);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const byCode = useCallback(
    (code: string): Department | undefined =>
      cache?.departments.find((d) => d.code === code),
    [],
  );

  return {
    departments,
    colleges: cache?.colleges ?? new Map(),
    loading,
    error,
    byCode,
  };
}
