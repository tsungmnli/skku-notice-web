export const CATEGORY_NAMES: Record<string, string> = {
  academic: "학사",
  admission: "입학",
  career: "취업",
  recruit: "채용·모집",
  scholarship: "장학",
  event: "행사·세미나",
  general: "일반",
};

export const CATEGORY_CODES = Object.keys(CATEGORY_NAMES);

export function categoryLabel(code: string): string {
  return CATEGORY_NAMES[code] || code;
}

export const SORT_LABELS: Record<string, string> = {
  posted_desc: "최신순",
  posted_asc: "오래된순",
  views_desc: "조회 많은순",
  deadline_asc: "마감 임박순",
};

export const PINNED_LABELS: Record<string, string> = {
  include: "포함",
  exclude: "제외",
  only: "고정만",
};

/** 서버가 받는 검색어 최대 길이 (초과하면 422). */
export const SEARCH_MAX_LENGTH = 100;

/** 서버가 받는 page 상한 (초과하면 422). */
export const MAX_PAGE = 100_000;

/** 학과 추가 요청 폼 URL. 비어 있으면 "내 학과가 없어요" 링크를 표시하지 않는다. */
export const DEPT_REQUEST_URL = process.env.NEXT_PUBLIC_DEPT_REQUEST_URL ?? "";
