"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isMockMode } from "@/lib/auth/config";
import type { DeptSelection } from "@/lib/departments/selection";
import { EMPTY_SELECTION } from "@/lib/departments/selection";

const STORAGE_KEY = isMockMode
  ? "skku-notice-departments:mock"
  : "skku-notice-departments";
const CHANGE_EVENT = "depts-changed";

function parseSelection(raw: string | null): DeptSelection {
  if (!raw) return EMPTY_SELECTION;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return EMPTY_SELECTION;
    }
    const obj = parsed as Partial<DeptSelection>;
    const departments = Array.isArray(obj.departments)
      ? obj.departments.filter((x): x is string => typeof x === "string")
      : [];
    const sources = Array.isArray(obj.sources)
      ? obj.sources.filter((x): x is string => typeof x === "string")
      : [];
    return { departments, sources };
  } catch {
    return EMPTY_SELECTION;
  }
}

let cachedRaw: string | null = null;
let cachedSelection: DeptSelection = EMPTY_SELECTION;

function getSnapshot(): DeptSelection {
  if (typeof window === "undefined") return EMPTY_SELECTION;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_SELECTION;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSelection = parseSelection(raw);
  }
  return cachedSelection;
}

function getServerSnapshot(): DeptSelection {
  return EMPTY_SELECTION;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function writeSelection(sel: DeptSelection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

const noopSubscribe = () => () => {};

export function useDeptSelection() {
  const selection = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const setSelection = useCallback((sel: DeptSelection) => {
    writeSelection(sel);
  }, []);

  const toggleDepartment = useCallback((code: string) => {
    const current = getSnapshot();
    const departments = current.departments.includes(code)
      ? current.departments.filter((c) => c !== code)
      : [...current.departments, code];
    writeSelection({ ...current, departments });
  }, []);

  const toggleSource = useCallback((slug: string, departmentCode: string) => {
    const current = getSnapshot();
    const sources = current.sources.includes(slug)
      ? current.sources.filter((s) => s !== slug)
      : [...current.sources, slug];
    // 전공을 고르면 학부 전체(departmentCode) 선택은 해제
    let departments = current.departments;
    if (
      !current.sources.includes(slug) &&
      departments.includes(departmentCode)
    ) {
      departments = departments.filter((c) => c !== departmentCode);
    }
    writeSelection({ departments, sources });
  }, []);

  const clear = useCallback(() => {
    writeSelection(EMPTY_SELECTION);
  }, []);

  return {
    selection,
    hydrated,
    setSelection,
    toggleDepartment,
    toggleSource,
    clear,
  };
}
