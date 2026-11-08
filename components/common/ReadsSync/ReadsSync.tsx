"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import type { ReadItem } from "@/lib/api/types";
import {
  setFlushFunctions,
  flushPending,
  flushPendingBeacon,
  clearServerReads,
  clearLocalReads,
  clearLocalReadsAfterMerge,
  getLocalReadsForUpload,
  setServerReads,
  purgeOldLocalReads,
  ensureBaseline,
} from "@/lib/reads/store";

const BATCH_SIZE = 200;

export function ReadsSync() {
  const { status, user } = useAuth();
  const prevStatus = useRef(status);

  // Set up flush/beacon functions once
  useEffect(() => {
    setFlushFunctions(
      async (items: ReadItem[]) => {
        await api.markReads(items);
      },
      (items: ReadItem[]) => api.sendReadsBeacon(items),
    );
  }, []);

  // Purge old local reads on mount
  useEffect(() => {
    purgeOldLocalReads();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (prev === status) return;

    if (status === "authenticated") {
      // Ensure baseline with user.created_at
      ensureBaseline(user?.created_at ?? null);

      // Merge local reads to server, then fetch server reads
      void (async () => {
        const localReads = getLocalReadsForUpload();
        if (localReads.length > 0) {
          for (let i = 0; i < localReads.length; i += BATCH_SIZE) {
            const batch = localReads.slice(i, i + BATCH_SIZE);
            try {
              await api.markReads(batch);
            } catch {
              // ignore merge errors
            }
          }
          clearLocalReadsAfterMerge();
        }
        try {
          const resp = await api.listReads();
          setServerReads(resp.items);
        } catch {
          // ignore
        }
      })();
    } else if (status === "anonymous") {
      clearServerReads();
      clearLocalReads();
    }
  }, [status, user]);

  // visibilitychange: fetch reads on visible, flush/beacon on hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (prevStatus.current === "authenticated") {
          void api
            .listReads()
            .then((resp) => {
              setServerReads(resp.items);
            })
            .catch(() => {});
        }
      } else {
        flushPending();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // pagehide: send remaining reads via beacon
  useEffect(() => {
    const handlePageHide = () => {
      flushPendingBeacon();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  return null;
}
