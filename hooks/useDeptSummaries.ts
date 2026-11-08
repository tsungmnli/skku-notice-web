"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { Article, ArticleScope, Department } from "@/lib/api/types";
import { useReads } from "@/hooks/useReads";
import { parseSeoul, todayInSeoul } from "@/utils/date";

export const DEADLINE_SOON_DAYS = 3;

export type DeptSummary = {
  code: string;
  name: string;
  collegeName: string | null;
  newCount: number;
  deadlineSoon: number;
  totalCount: number;
  hasData: boolean;
};

export type DeptSummaryMap = Map<string, DeptSummary>;

const EMPTY_SUMMARIES: DeptSummaryMap = new Map();

function buildSingleDeptScope(
  code: string,
  departmentsByCode: Map<string, Department>,
  selectedSources: string[],
): ArticleScope | null {
  const dept = departmentsByCode.get(code);
  if (!dept) return null;

  const scope: ArticleScope = {};
  if (selectedSources.length > 0) {
    const common = dept.sources.find((s) => s.common);
    const slugs = new Set<string>(selectedSources);
    if (common) slugs.add(common.slug);
    scope.source = [...slugs];
  } else {
    scope.department = [code];
  }

  if (dept.college) {
    scope.department = [...(scope.department ?? []), dept.college];
  }

  return scope;
}

export function useDeptSummaries(
  deptCodes: string[],
  departments: Department[],
  hydrated: boolean,
): { summaries: DeptSummaryMap; loading: boolean } {
  const { badgeOf } = useReads();
  const [summaries, setSummaries] = useState<DeptSummaryMap>(new Map());
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const inflightRef = useRef<string | null>(null);

  const departmentsByCode = useMemo(
    () => new Map(departments.map((d) => [d.code, d])),
    [departments],
  );

  const codesKey = deptCodes.join(",");
  const active = hydrated && deptCodes.length > 0;

  useEffect(() => {
    if (!active) return;

    if (inflightRef.current === codesKey) return;
    inflightRef.current = codesKey;

    let cancelled = false;

    void (async () => {
      const results = new Map<string, DeptSummary>();
      const today = todayInSeoul();
      const deadlineLimit = today.add(DEADLINE_SOON_DAYS, "day");

      await Promise.all(
        deptCodes.map(async (code) => {
          const dept = departmentsByCode.get(code);
          if (!dept) return;

          const collegeDept = dept.college
            ? departmentsByCode.get(dept.college)
            : null;

          const selectedSources = dept.sources
            .filter((s) => s.slug !== code)
            .map((s) => s.slug);

          const scope = buildSingleDeptScope(
            code,
            departmentsByCode,
            selectedSources,
          );
          if (!scope) return;

          try {
            const resp = await api.listArticles({
              ...scope,
              size: 50,
              sort: "posted_desc",
            });
            let newCount = 0;
            let deadlineSoon = 0;
            for (const article of resp.items as Article[]) {
              if (badgeOf(article) !== null) newCount++;
              if (article.deadline_at) {
                const dl = parseSeoul(article.deadline_at);
                if (
                  (dl.isAfter(today) || dl.isSame(today, "day")) &&
                  (dl.isBefore(deadlineLimit) ||
                    dl.isSame(deadlineLimit, "day"))
                ) {
                  deadlineSoon++;
                }
              }
            }
            results.set(code, {
              code,
              name: dept.name,
              collegeName: collegeDept?.name ?? null,
              newCount,
              deadlineSoon,
              totalCount: resp.total,
              hasData: resp.total > 0,
            });
          } catch {
            results.set(code, {
              code,
              name: dept.name,
              collegeName: collegeDept?.name ?? null,
              newCount: 0,
              deadlineSoon: 0,
              totalCount: 0,
              hasData: false,
            });
          }
        }),
      );

      if (!cancelled) {
        setSummaries(results);
        setLoadedKey(codesKey);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey, hydrated, badgeOf]);

  return {
    summaries: active ? summaries : EMPTY_SUMMARIES,
    loading: active && loadedKey !== codesKey,
  };
}
