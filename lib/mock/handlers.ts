import dayjs from "dayjs";
import { computeDDay, SEOUL_TZ } from "../../utils/date";
import { mockArticles, mockCategoryList, mockWriterList } from "./data";
import type {
  Article,
  ArticleListResponse,
  ArticleQuery,
  Category,
  LookupResponse,
  Writer,
} from "../api/types";

// Simulate network latency
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function matchesQuery(article: Article, q?: string): boolean {
  if (!q) return true;
  const terms = q.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack =
    `${article.title} ${article.writer} ${article.categories.join(" ")}`.toLowerCase();
  return terms.every((t) => haystack.includes(t.toLowerCase()));
}

function matchesCategories(article: Article, categories?: string[]): boolean {
  if (!categories || categories.length === 0) return true;
  return categories.some((c) => article.categories.includes(c));
}

function matchesWriters(article: Article, writers?: string[]): boolean {
  if (!writers || writers.length === 0) return true;
  return writers.includes(article.writer);
}

function matchesDateRange(
  article: Article,
  from?: string,
  to?: string,
): boolean {
  if (from && article.posted_on < from) return false;
  if (to && article.posted_on > to) return false;
  return true;
}

function matchesPinned(article: Article, pinned?: string): boolean {
  if (pinned === "only") return article.is_pinned;
  if (pinned === "exclude") return !article.is_pinned;
  return true;
}

function matchesHasDeadline(article: Article, hasDeadline?: boolean): boolean {
  if (hasDeadline === undefined) return true;
  if (hasDeadline) return article.deadline_at !== null;
  return true;
}

function matchesDeadlineRange(
  article: Article,
  from?: string,
  to?: string,
): boolean {
  if (!from && !to) return true;
  if (!article.deadline_at) return false;
  const dl = dayjs.tz(article.deadline_at, SEOUL_TZ);
  const dlDate = dl.format("YYYY-MM-DD");
  if (from && dlDate < from) return false;
  if (to && dlDate > to) return false;
  return true;
}

function sortArticles(items: Article[], sort?: string): Article[] {
  const sorted = [...items];
  switch (sort) {
    case "posted_asc":
      return sorted.sort((a, b) => a.posted_on.localeCompare(b.posted_on));
    case "views_desc":
      return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    case "deadline_asc": {
      // exclude passed deadlines unless deadline range given
      const now = dayjs.tz(new Date(), SEOUL_TZ).startOf("day");
      const withDl = sorted.filter((a) => {
        if (!a.deadline_at) return false;
        const dl = dayjs.tz(a.deadline_at, SEOUL_TZ).startOf("day");
        return dl.isAfter(now) || dl.isSame(now);
      });
      return withDl.sort((a, b) => {
        const da = dayjs.tz(a.deadline_at!, SEOUL_TZ).valueOf();
        const db = dayjs.tz(b.deadline_at!, SEOUL_TZ).valueOf();
        return da - db;
      });
    }
    case "posted_desc":
    default:
      return sorted.sort((a, b) => b.posted_on.localeCompare(a.posted_on));
  }
}

export async function mockListArticles(
  query: ArticleQuery,
): Promise<ArticleListResponse> {
  await delay(300);

  if (query.date_from && query.date_to && query.date_from > query.date_to) {
    throw new Error("date_from은 date_to보다 이후일 수 없습니다.");
  }
  if (
    query.deadline_from &&
    query.deadline_to &&
    query.deadline_from > query.deadline_to
  ) {
    throw new Error("deadline_from은 deadline_to보다 이후일 수 없습니다.");
  }

  let items = mockArticles.filter((a) => {
    return (
      matchesQuery(a, query.q) &&
      matchesCategories(a, query.category) &&
      matchesWriters(a, query.writer) &&
      matchesDateRange(a, query.date_from, query.date_to) &&
      matchesPinned(a, query.pinned) &&
      matchesHasDeadline(a, query.has_deadline) &&
      matchesDeadlineRange(a, query.deadline_from, query.deadline_to)
    );
  });

  // For deadline_asc with explicit range, the range wins over "exclude passed"
  if (
    query.sort === "deadline_asc" &&
    (query.deadline_from || query.deadline_to)
  ) {
    const sorted = items.filter((a) => a.deadline_at !== null);
    sorted.sort((a, b) => {
      const da = dayjs.tz(a.deadline_at!, SEOUL_TZ).valueOf();
      const db = dayjs.tz(b.deadline_at!, SEOUL_TZ).valueOf();
      return da - db;
    });
    items = sorted;
  } else {
    items = sortArticles(items, query.sort);
  }

  const page = query.page || 1;
  const size = Math.min(50, Math.max(1, query.size || 20));
  const start = (page - 1) * size;
  const pageItems = items.slice(start, start + size);

  return {
    items: pageItems,
    total: items.length,
    page,
    size,
    has_next: start + size < items.length,
  };
}

export async function mockGetArticle(id: number): Promise<Article> {
  await delay(200);
  const found = mockArticles.find((a) => a.id === id);
  if (!found) throw new Error("게시글을 찾을 수 없습니다.");
  return found;
}

export async function mockLookupArticles(
  ids: number[],
): Promise<LookupResponse> {
  await delay(300);
  if (ids.length < 1 || ids.length > 200) {
    throw new Error("조회할 ID는 1~200개까지 가능합니다.");
  }
  const items: Article[] = [];
  const missingIds: number[] = [];
  for (const id of ids) {
    const found = mockArticles.find((a) => a.id === id);
    if (found) {
      items.push(found);
    } else {
      missingIds.push(id);
    }
  }
  return { items, missing_ids: missingIds };
}

export async function mockListCategories(): Promise<Category[]> {
  await delay(150);
  return mockCategoryList();
}

export async function mockListWriters(
  q?: string,
  limit?: number,
): Promise<Writer[]> {
  await delay(150);
  return mockWriterList(q, limit);
}

export async function mockCalendarDeadlines(
  deadlineFrom: string,
  deadlineTo: string,
  page = 1,
  size = 50,
): Promise<ArticleListResponse> {
  await delay(300);
  return mockListArticles({
    has_deadline: true,
    deadline_from: deadlineFrom,
    deadline_to: deadlineTo,
    sort: "deadline_asc",
    page,
    size,
  });
}

export { computeDDay };
