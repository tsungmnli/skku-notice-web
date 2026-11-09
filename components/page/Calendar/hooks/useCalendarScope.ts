"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isMockMode } from "@/lib/auth/config";
import { hasSelection } from "@/lib/departments/selection";
import type { DeptSelection } from "@/lib/departments/selection";

export type ScopeFilter = "dept" | "all" | "campus";

const STORAGE_KEY = isMockMode
  ? "skku-notice-calendar-scope:mock"
  : "skku-notice-calendar-scope";
const CHANGE_EVENT = "calendar-scope-changed";

function readStored(): ScopeFilter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "dept" || raw === "all" || raw === "campus") return raw;
    return null;
  } catch {
    return null;
  }
}

function writeStored(scope: ScopeFilter): void {
  try {
    localStorage.setItem(STORAGE_KEY, scope);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot(): ScopeFilter | null {
  return null;
}

/**
 * 마지막으로 고른 범위는 localStorage 에 두고, 실제로 보여줄 범위는 렌더 중에 계산한다.
 * (effect 안에서 setState 하지 않는다.)
 * - 저장값이 없으면: 학과를 골랐으면 "dept", 아니면 "campus"
 * - 저장값이 학과가 필요한 값("dept"/"all")인데 학과가 없으면: "campus" 로 대체
 *   (저장값은 그대로 두므로, 나중에 학과를 다시 고르면 원래 선택이 돌아온다)
 */
export function useCalendarScope(selection: DeptSelection, hydrated: boolean) {
  const remembered = useSyncExternalStore(
    subscribe,
    readStored,
    getServerSnapshot,
  );

  let scope: ScopeFilter = "campus";
  if (hydrated) {
    const hasDepts = hasSelection(selection);
    if (remembered === null) {
      scope = hasDepts ? "dept" : "campus";
    } else if ((remembered === "dept" || remembered === "all") && !hasDepts) {
      scope = "campus";
    } else {
      scope = remembered;
    }
  }

  const change = useCallback((next: ScopeFilter) => {
    writeStored(next);
  }, []);

  return { scope, setScope: change };
}
