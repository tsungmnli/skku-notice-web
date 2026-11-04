"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CalendarPrefs } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { isMockMode } from "@/lib/auth/config";

const STORAGE_KEY = "skku-notice-calendar-prefs";
const MOCK_SUFFIX = ":mock";

const CODE_PATTERN = /^[a-z0-9_-]{1,32}$/;

const DEFAULT_PREFS: CalendarPrefs = {
  hidden_categories: [],
  favorites_only: false,
};

function storageKey(): string {
  return isMockMode ? `${STORAGE_KEY}${MOCK_SUFFIX}` : STORAGE_KEY;
}

export function sanitizePrefs(raw: unknown): CalendarPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const obj = raw as Record<string, unknown>;
  const hiddenRaw = Array.isArray(obj.hidden_categories)
    ? obj.hidden_categories
    : [];
  const hidden = Array.from(
    new Set(
      hiddenRaw.filter(
        (c): c is string => typeof c === "string" && CODE_PATTERN.test(c),
      ),
    ),
  ).slice(0, 20);
  const favorites_only =
    typeof obj.favorites_only === "boolean" ? obj.favorites_only : false;
  return { hidden_categories: hidden, favorites_only };
}

function readLocal(): CalendarPrefs {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...DEFAULT_PREFS };
    return sanitizePrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function writeLocal(prefs: CalendarPrefs): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

function getInitialPrefs(): CalendarPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  return readLocal();
}

const emptySubscribe = () => () => {};

export function useCalendarPrefs() {
  const { status, user } = useAuth();
  const [prefs, setPrefs] = useState<CalendarPrefs>(getInitialPrefs);
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const serverSyncedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPrefsRef = useRef<CalendarPrefs>(prefs);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !user ||
      serverSyncedRef.current ||
      !hydrated
    )
      return;
    serverSyncedRef.current = true;
    const serverPrefs = user.preferences?.calendar;
    if (serverPrefs) {
      const sanitized = sanitizePrefs(serverPrefs);
      latestPrefsRef.current = sanitized;
      writeLocal(sanitized);
      queueMicrotask(() => setPrefs(sanitized));
    } else {
      const local = readLocal();
      if (local.hidden_categories.length > 0 || local.favorites_only) {
        void api.updatePreferences({ calendar: local }).catch(() => {});
      }
    }
  }, [hydrated, status, user]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const update = useCallback(
    (patch: Partial<CalendarPrefs>) => {
      setPrefs((prev) => {
        const next: CalendarPrefs = {
          hidden_categories: patch.hidden_categories ?? prev.hidden_categories,
          favorites_only: patch.favorites_only ?? prev.favorites_only,
        };
        latestPrefsRef.current = next;
        writeLocal(next);
        if (status === "authenticated") {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            void api.updatePreferences({ calendar: next }).catch(() => {});
          }, 800);
        }
        return next;
      });
    },
    [status],
  );

  const reset = useCallback(() => {
    update({ hidden_categories: [], favorites_only: false });
  }, [update]);

  return { prefs, hydrated, update, reset };
}
