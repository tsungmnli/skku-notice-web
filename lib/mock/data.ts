import type { Article } from "../api/types";

const writers = [
  "교무팀",
  "학사지원팀",
  "입학처",
  "학생지원팀",
  "산학협력단",
  "장학팀",
  "취업지원팀",
  "국제처",
  "연구지원팀",
  "총학생회",
];

const categoryMap: Record<string, string> = {
  academic: "학사",
  admission: "입학",
  career: "취업",
  recruit: "채용·모집",
  scholarship: "장학",
  event: "행사·세미나",
  general: "일반",
};

export const categoryNames = categoryMap;

function pickCategories(seed: number): string[] {
  const codes = Object.keys(categoryMap);
  const count = (seed % 3) + 1;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = codes[(seed + i * 3) % codes.length];
    if (!result.includes(code)) result.push(code);
  }
  return result;
}

function makeArticle(i: number): Article {
  const id = 1000 + i;
  const writer = writers[i % writers.length];
  const cats = pickCategories(i);
  const posted = `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`;

  // ~40% have deadlines
  let deadlineAt: string | null = null;
  if (i % 5 === 0) {
    // deadline passed
    const day = String((i % 10) + 1).padStart(2, "0");
    deadlineAt = `2026-02-${day}T23:59:00+09:00`;
  } else if (i % 5 === 1) {
    // deadline with time
    const day = String((i % 20) + 5).padStart(2, "0");
    deadlineAt = `2026-10-${day}T17:00:00+09:00`;
  } else if (i % 5 === 2) {
    // deadline date-only (23:59)
    const day = String((i % 20) + 10).padStart(2, "0");
    deadlineAt = `2026-11-${day}T23:59:00+09:00`;
  } else if (i % 5 === 3) {
    // near-future deadline
    const day = String((i % 20) + 18).padStart(2, "0");
    deadlineAt = `2026-10-${day}T23:59:00+09:00`;
  }

  const isPinned = i % 7 === 0;
  const viewCount = Math.floor(((i * 37) % 5000) + 50);

  const titleVariants = [
    "학사일정 변경 안내",
    "입학설명회 개최 안내",
    "채용 정보 업데이트",
    "취업 박람회 참가 신청",
    "장학금 신청 안내",
    "학술 세미나 개최",
    "교내 행사 참가 모집",
    "시험 응시 규정 안내",
    "연구 과제 공고",
    "국제 교류 프로그램 모집",
  ];

  return {
    id,
    article_no: id,
    title: `${titleVariants[i % titleVariants.length]} (${id})`,
    writer,
    posted_on: posted,
    display_no: i % 2 === 0 ? id : null,
    is_pinned: isPinned,
    view_count: viewCount,
    url: `https://www.skku.edu/skku/campus/skk_community_1.do?article_no=${id}`,
    categories: cats,
    deadline_at: deadlineAt,
  };
}

export const mockArticles: Article[] = Array.from({ length: 36 }, (_, i) =>
  makeArticle(i),
);

export function mockCategoryList() {
  const counts: Record<string, number> = {};
  for (const a of mockArticles) {
    for (const c of a.categories) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  return Object.entries(categoryMap).map(([code, name]) => ({
    code,
    name,
    count: counts[code] || 0,
  }));
}

export function mockWriterList(q?: string, limit?: number) {
  const counts: Record<string, number> = {};
  for (const a of mockArticles) {
    counts[a.writer] = (counts[a.writer] || 0) + 1;
  }
  let entries = Object.entries(counts).map(([writer, count]) => ({
    writer,
    count,
  }));
  if (q) {
    entries = entries.filter((e) => e.writer.includes(q));
  }
  entries.sort((a, b) => b.count - a.count);
  if (limit) entries = entries.slice(0, limit);
  return entries;
}
