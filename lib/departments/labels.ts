import type { Article, Department } from "@/lib/api/types";

/**
 * 글머리(origin) 라벨. article.department === "skku"이면 붙이지 않는다.
 * 학과의 sources가 둘 이상일 때만 " · " + article.source_name을 덧붙인다.
 */
export function originLabel(
  article: Article,
  departmentsByCode: Map<string, Department>,
): string | null {
  if (article.department === "skku") return null;

  const dept = departmentsByCode.get(article.department);
  const hasMultipleSources = dept ? dept.sources.length > 1 : false;

  if (hasMultipleSources) {
    return `${article.department_name} · ${article.source_name}`;
  }

  return article.department_name;
}
