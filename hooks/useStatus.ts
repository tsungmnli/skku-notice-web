"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Status } from "@/lib/api/types";

type Cache = {
  status: Status;
  fetchedAt: number;
};

const TTL = 60_000;
let cache: Cache | null = null;

export function useStatus() {
  const [status, setStatus] = useState<Status | null>(cache?.status ?? null);

  useEffect(() => {
    // Initial state is already seeded from a fresh cache.
    if (cache && Date.now() - cache.fetchedAt < TTL) return;

    let cancelled = false;

    void (async () => {
      try {
        const s = await api.getStatus();
        if (cancelled) return;
        cache = { status: s, fetchedAt: Date.now() };
        setStatus(s);
      } catch {
        if (cancelled) return;
        setStatus(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
