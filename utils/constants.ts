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
