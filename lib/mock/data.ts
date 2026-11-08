import { todayInSeoul } from "../../utils/date";
import type { Article, ArticleScope } from "../api/types";

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

export type MockDepartmentDef = {
  code: string;
  name: string;
  kind: "college" | "department";
  college: string | null;
  board_url?: string | null;
};

// --- Generated mock colleges and departments for picker-at-scale testing ---
const EXTRA_COLLEGES: { code: string; name: string }[] = [
  { code: "hum", name: "인문과학대학" },
  { code: "soc", name: "사회과학대학" },
  { code: "eng", name: "공과대학" },
  { code: "bus", name: "경영대학" },
  { code: "med", name: "의과대학" },
];

const EXTRA_DEPT_NAMES: Record<string, string[]> = {
  hum: [
    "국어국문학과",
    "영어영문학과",
    "사학과",
    "철학과",
    "독어독문학과",
    "불어불문학과",
    "한문학과",
  ],
  soc: [
    "정치외교학과",
    "신문방송학과",
    "사회학과",
    "심리학과",
    "경제학과",
    "문헌정보학과",
    "아동청소년학과",
  ],
  eng: [
    "기계공학과",
    "전자전기공학과",
    "화학공학과",
    "신소재공학과",
    "건축학과",
    "환경공학과",
    "산업공학과",
    "생명공학과",
  ],
  bus: [
    "경영학과",
    "국제통상학과",
    "회계학과",
    "금융학과",
    "경영정보학과",
    "광고홍보학과",
  ],
  med: ["의학과", "간호학과", "약학과", "바이오메디컬공학과"],
};

// 2-3 departments with zero notices (picked from the end of some colleges)
const ZERO_NOTICE_DEPTS = new Set(["hum-chi", "soc-child", "med-bio"]);

function generateExtraDepartmentDefs(): MockDepartmentDef[] {
  const defs: MockDepartmentDef[] = [];
  for (const college of EXTRA_COLLEGES) {
    defs.push({
      code: college.code,
      name: college.name,
      kind: "college",
      college: null,
    });
    const names = EXTRA_DEPT_NAMES[college.code];
    for (let i = 0; i < names.length; i++) {
      const deptCode = `${college.code}-${String.fromCharCode(97 + i)}`;
      const hasZero = ZERO_NOTICE_DEPTS.has(deptCode);
      defs.push({
        code: deptCode,
        name: names[i],
        kind: "department",
        college: college.code,
        board_url: hasZero
          ? null
          : `https://www.skku.edu/skku/campus/skk_community_1.do`,
      });
    }
  }
  return defs;
}

export const MOCK_DEPARTMENT_DEFS: MockDepartmentDef[] = [
  { code: "sw", name: "소프트웨어융합대학", kind: "college", college: null },
  {
    code: "cse",
    name: "소프트웨어학과",
    kind: "department",
    college: "sw",
    board_url: "https://www.skku.edu/skku/campus/skk_community_1.do",
  },
  {
    code: "intelligentsw",
    name: "지능형소프트웨어학과",
    kind: "department",
    college: "sw",
    board_url: "https://www.skku.edu/skku/campus/skk_community_1.do",
  },
  {
    code: "ai",
    name: "인공지능학과",
    kind: "department",
    college: "sw",
    board_url: "https://www.skku.edu/skku/campus/skk_community_1.do",
  },
  {
    code: "sco",
    name: "글로벌융합학부",
    kind: "department",
    college: "sw",
    board_url: "https://www.skku.edu/skku/campus/skk_community_1.do",
  },
  ...generateExtraDepartmentDefs(),
];

export type MockBoardDef = {
  slug: string;
  name: string;
  department: string;
  level: "all" | "undergrad" | "grad";
  common: boolean;
  articleCount: number;
  oldArticles: boolean;
};

function generateExtraBoardDefs(): MockBoardDef[] {
  const boards: MockBoardDef[] = [];
  for (const college of EXTRA_COLLEGES) {
    const names = EXTRA_DEPT_NAMES[college.code];
    for (let i = 0; i < names.length; i++) {
      const deptCode = `${college.code}-${String.fromCharCode(97 + i)}`;
      if (ZERO_NOTICE_DEPTS.has(deptCode)) {
        boards.push({
          slug: deptCode,
          name: "공지사항",
          department: deptCode,
          level: "undergrad" as const,
          common: false,
          articleCount: 0,
          oldArticles: false,
        });
      } else {
        boards.push({
          slug: deptCode,
          name: "공지사항",
          department: deptCode,
          level: "undergrad" as const,
          common: false,
          articleCount: 2,
          oldArticles: false,
        });
      }
    }
  }
  return boards;
}

export const MOCK_BOARD_DEFS: MockBoardDef[] = [
  {
    slug: "sw",
    name: "공지사항",
    department: "sw",
    level: "undergrad",
    common: false,
    articleCount: 8,
    oldArticles: false,
  },
  {
    slug: "cse",
    name: "공지사항",
    department: "cse",
    level: "undergrad",
    common: false,
    articleCount: 12,
    oldArticles: false,
  },
  {
    slug: "intelligentsw",
    name: "공지사항",
    department: "intelligentsw",
    level: "undergrad",
    common: false,
    articleCount: 5,
    oldArticles: false,
  },
  {
    slug: "ai",
    name: "공지사항",
    department: "ai",
    level: "undergrad",
    common: false,
    articleCount: 6,
    oldArticles: false,
  },
  {
    slug: "sco-notice",
    name: "공통",
    department: "sco",
    level: "undergrad",
    common: true,
    articleCount: 10,
    oldArticles: false,
  },
  {
    slug: "sco-data",
    name: "데이터사이언스융합전공",
    department: "sco",
    level: "undergrad",
    common: false,
    articleCount: 5,
    oldArticles: false,
  },
  {
    slug: "sco-ai",
    name: "인공지능융합전공",
    department: "sco",
    level: "undergrad",
    common: false,
    articleCount: 4,
    oldArticles: false,
  },
  {
    slug: "sco-culture",
    name: "컬처앤테크놀로지융합전공",
    department: "sco",
    level: "undergrad",
    common: false,
    articleCount: 0,
    oldArticles: false,
  },
  {
    slug: "sco-magnetic",
    name: "자기설계융합전공",
    department: "sco",
    level: "undergrad",
    common: false,
    articleCount: 1,
    oldArticles: true,
  },
  ...generateExtraBoardDefs(),
];

const MIXED_CATEGORY_BOARDS = ["cse", "sw", "sco-notice"];

export function sourcesForScope(scope?: ArticleScope): string[] | null {
  if (
    !scope ||
    ((!scope.department || scope.department.length === 0) &&
      (!scope.source || scope.source.length === 0))
  ) {
    return null;
  }
  const slugs = new Set<string>();
  if (scope.department) {
    for (const dept of scope.department) {
      for (const board of MOCK_BOARD_DEFS) {
        if (board.department === dept) {
          slugs.add(board.slug);
        }
      }
    }
  }
  if (scope.source) {
    for (const slug of scope.source) {
      slugs.add(slug);
    }
  }
  return [...slugs];
}

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

function pickDeptCategories(index: number): string[] {
  const codes = ["recruit", "event", "scholarship", "academic", "general"];
  const count = (index % 3) + 1;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = codes[(index + i * 2) % codes.length];
    if (!result.includes(code)) result.push(code);
  }
  return result;
}

const today = todayInSeoul();

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

const CONTENT_CHANGED_INDICES = [3, 5, 8, 12];

function makeSkkuArticle(i: number): Article {
  const id = 1000 + i;
  const writer = writers[i % writers.length];
  const cats = pickCategories(i);
  const daysAgo = i < 16 ? Math.min(i, 14) : null;
  const posted =
    daysAgo !== null
      ? today.subtract(daysAgo, "day").format("YYYY-MM-DD")
      : `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`;

  let deadlineAt: string | null = null;
  let deadlineSource: "title" | "body" | null = null;
  if (i % 5 === 0) {
    const day = String((i % 10) + 1).padStart(2, "0");
    deadlineAt = `2026-02-${day}T23:59:00+09:00`;
    deadlineSource = "title";
  } else if (i % 5 === 1) {
    const day = String((i % 20) + 5).padStart(2, "0");
    deadlineAt = `2026-10-${day}T17:00:00+09:00`;
    deadlineSource = "body";
  } else if (i % 5 === 2) {
    const day = String((i % 20) + 10).padStart(2, "0");
    deadlineAt = `2026-11-${day}T23:59:00+09:00`;
    deadlineSource = "title";
  } else if (i % 5 === 3) {
    const day = String((i % 20) + 18).padStart(2, "0");
    deadlineAt = `2026-10-${day}T23:59:00+09:00`;
    deadlineSource = "body";
  }

  const eventDay = `2026-11-${String((i % 20) + 3).padStart(2, "0")}`;
  const eventAt =
    i % 6 === 0
      ? i % 12 === 0
        ? eventDay
        : `${eventDay}T14:00:00+09:00`
      : null;

  const isPinned = i % 7 === 0;
  const viewCount = Math.floor(((i * 37) % 5000) + 50);
  const hasAttachment = i % 3 === 0;
  const deadlineHasTime =
    deadlineAt !== null && !deadlineAt.endsWith("T23:59:00+09:00");
  const eventHasTime = eventAt !== null && eventAt.includes("T");

  let contentChangedAt: string | null = null;
  if (CONTENT_CHANGED_INDICES.includes(i)) {
    const changedDaysAgo = 1 + (i % 3);
    if (daysAgo !== null && changedDaysAgo < daysAgo) {
      contentChangedAt = today
        .subtract(changedDaysAgo, "day")
        .hour(10 + (i % 8))
        .minute(30)
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DDTHH:mm:ssZ");
    }
  }

  return {
    id,
    article_no: id,
    source: "skku",
    source_name: "공지사항",
    department: "skku",
    department_name: "성균관대학교",
    title: `${titleVariants[i % titleVariants.length]} (${id})`,
    writer,
    posted_on: posted,
    display_no: i % 2 === 0 ? id : null,
    is_pinned: isPinned,
    view_count: viewCount,
    url: `https://www.skku.edu/skku/campus/skk_community_1.do?article_no=${id}`,
    has_attachment: hasAttachment,
    categories: cats,
    deadline_at: deadlineAt,
    event_at: eventAt,
    deadline_source: deadlineSource,
    deadline_has_time: deadlineHasTime,
    event_has_time: eventHasTime,
    content_changed_at: contentChangedAt,
  };
}

const deptWriters = [
  "소프트웨어융합대학 행정실",
  "소프트웨어학과 행정실",
  "지능형소프트웨어학과 행정실",
  "인공지능학과 행정실",
  "글로벌융합학부 행정실",
  "학과장",
  "대학원 행정실",
];

const deptTitleVariants = [
  "학과 공지사항",
  "수강 신청 안내",
  "졸업 논문 안내",
  "장학금 신청 안내",
  "학과 세미나 안내",
  "현장실습 모집",
  "코딩 대회 안내",
  "학회 발표 안내",
  "연구 참여 모집",
  "학과 행사 안내",
  "학사 경고 안내",
  "졸업 요건 변경 안내",
  "계절학기 수강 신청",
  "학과 OT 개최 안내",
  "교환학생 모집 안내",
];

function makeDeptArticle(
  board: MockBoardDef,
  index: number,
  id: number,
): Article {
  const deptDef = MOCK_DEPARTMENT_DEFS.find(
    (d) => d.code === board.department,
  )!;
  const daysAgo = board.oldArticles
    ? 300 + (index % 60)
    : (index * 7 + board.slug.charCodeAt(0)) % 46;
  const posted = today.subtract(daysAgo, "day").format("YYYY-MM-DD");

  const cats = MIXED_CATEGORY_BOARDS.includes(board.slug)
    ? pickDeptCategories(index)
    : ["general"];

  let deadlineAt: string | null = null;
  let deadlineSource: "title" | "body" | null = null;
  if (!board.oldArticles) {
    if (index % 3 === 0) {
      const dlDay = today.add(5 + (index % 25), "day");
      deadlineAt = `${dlDay.format("YYYY-MM-DD")}T17:00:00+09:00`;
      deadlineSource = "title";
    } else if (index % 3 === 1) {
      const dlDay = today.add(10 + (index % 30), "day");
      deadlineAt = `${dlDay.format("YYYY-MM-DD")}T23:59:00+09:00`;
      deadlineSource = "body";
    }
  }

  let eventAt: string | null = null;
  if (!board.oldArticles) {
    if (index % 5 === 0) {
      const evDay = today.add(7 + (index % 20), "day");
      eventAt = `${evDay.format("YYYY-MM-DD")}T14:00:00+09:00`;
    } else if (index % 5 === 1) {
      const evDay = today.add(14 + (index % 14), "day");
      eventAt = evDay.format("YYYY-MM-DD");
    }
  }

  const hasAttachment = index % 4 === 0;
  const deadlineHasTime =
    deadlineAt !== null && !deadlineAt.endsWith("T23:59:00+09:00");
  const eventHasTime = eventAt !== null && eventAt.includes("T");

  let contentChangedAt: string | null = null;
  if (!board.oldArticles && daysAgo >= 3 && index % 4 === 0) {
    const changedDaysAgo = 1 + (index % 3);
    if (changedDaysAgo < daysAgo) {
      contentChangedAt = today
        .subtract(changedDaysAgo, "day")
        .hour(10 + (index % 8))
        .minute(30)
        .second(0)
        .millisecond(0)
        .format("YYYY-MM-DDTHH:mm:ssZ");
    }
  }

  const writer = deptWriters[index % deptWriters.length];
  const viewCount = Math.floor(((index * 41) % 3000) + 20);

  return {
    id,
    article_no: id,
    source: board.slug,
    source_name: board.name,
    department: board.department,
    department_name: deptDef.name,
    title: `${deptTitleVariants[index % deptTitleVariants.length]} (${id})`,
    writer,
    posted_on: posted,
    display_no: id,
    is_pinned: index === 0,
    view_count: viewCount,
    url: `https://www.skku.edu/skku/campus/skk_community_1.do?article_no=${id}`,
    has_attachment: hasAttachment,
    categories: cats,
    deadline_at: deadlineAt,
    event_at: eventAt,
    deadline_source: deadlineSource,
    deadline_has_time: deadlineHasTime,
    event_has_time: eventHasTime,
    content_changed_at: contentChangedAt,
  };
}

function generateDeptArticles(): Article[] {
  const articles: Article[] = [];
  let nextId = 2000;
  for (const board of MOCK_BOARD_DEFS) {
    for (let i = 0; i < board.articleCount; i++) {
      articles.push(makeDeptArticle(board, i, nextId));
      nextId++;
    }
  }
  return articles;
}

export const mockArticles: Article[] = [
  ...Array.from({ length: 36 }, (_, i) => makeSkkuArticle(i)),
  ...generateDeptArticles(),
];

export function mockCategoryList(scope?: ArticleScope) {
  const slugs = sourcesForScope(scope);
  const articles = mockArticles.filter((a) =>
    slugs === null ? a.source === "skku" : slugs.includes(a.source),
  );
  const counts: Record<string, number> = {};
  for (const a of articles) {
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

export function mockWriterList(
  q?: string,
  limit?: number,
  scope?: ArticleScope,
) {
  const slugs = sourcesForScope(scope);
  const articles = mockArticles.filter((a) =>
    slugs === null ? a.source === "skku" : slugs.includes(a.source),
  );
  const counts: Record<string, number> = {};
  for (const a of articles) {
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
