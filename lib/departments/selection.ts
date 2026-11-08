import type { ArticleScope, Department } from "@/lib/api/types";
import { isMockMode } from "@/lib/auth/config";

export type DeptSelection = {
  departments: string[];
  sources: string[];
};

export const EMPTY_SELECTION: DeptSelection = {
  departments: [],
  sources: [],
};

export const ACTIVE_DEPT_STORAGE_KEY = isMockMode
  ? "skku-notice-active-dept:mock"
  : "skku-notice-active-dept";

export function getActiveDept(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_DEPT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setActiveDept(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_DEPT_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export function hasSelection(selection: DeptSelection): boolean {
  return selection.departments.length > 0 || selection.sources.length > 0;
}

type ScopedBuild = {
  dept: ArticleScope;
  college: ArticleScope;
  all: ArticleScope;
};

export function buildScopes(
  selection: DeptSelection,
  departments: Department[],
): ScopedBuild {
  const deptSet = new Set<string>();
  const deptSourceSet = new Set<string>();
  const collegeSet = new Set<string>();

  const deptByCode = new Map(departments.map((d) => [d.code, d]));

  for (const code of selection.departments) {
    const dept = deptByCode.get(code);
    if (!dept) continue;
    deptSet.add(code);
    if (dept.college) collegeSet.add(dept.college);
  }

  for (const slug of selection.sources) {
    const dept = departments.find((d) =>
      d.sources.some((s) => s.slug === slug),
    );
    if (!dept) continue;
    deptSourceSet.add(slug);
    const commonSource = dept.sources.find((s) => s.common);
    if (commonSource) deptSourceSet.add(commonSource.slug);
    if (dept.college) collegeSet.add(dept.college);
  }

  const dept: ArticleScope = {
    department: [...deptSet],
    source: [...deptSourceSet],
  };
  if (dept.department!.length === 0) delete dept.department;
  if (dept.source!.length === 0) delete dept.source;

  const college: ArticleScope = {
    department: [...collegeSet],
  };
  if (college.department!.length === 0) delete college.department;

  const allDept = [
    ...new Set([...(dept.department ?? []), ...(college.department ?? [])]),
  ];
  const allSources = dept.source ?? [];
  const all: ArticleScope = {
    department: allDept,
    source: allSources,
  };
  if (all.department!.length === 0) delete all.department;
  if (all.source!.length === 0) delete all.source;

  return { dept, college, all };
}
