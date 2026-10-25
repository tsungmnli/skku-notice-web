import type {
  Article,
  ArticleListResponse,
  ArticleQuery,
  Category,
  LookupResponse,
  Writer,
} from "./types";

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/** Single source of truth for the backend base URL. */
export const API_BASE = ENV_API_BASE || "http://localhost:8000/api/v1";

// Mock is opt-in. Falling back to mock when API_BASE is missing is a dev-only
// convenience, so a forgotten env var in production fails loudly instead of
// silently serving fake data.
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (!ENV_API_BASE && process.env.NODE_ENV !== "production");

function buildQuery(
  params: ArticleQuery,
): Record<string, string | string[] | number | boolean> {
  const q: Record<string, string | string[] | number | boolean> = {};
  if (params.q) q.q = params.q;
  if (params.category && params.category.length) q.category = params.category;
  if (params.writer && params.writer.length) q.writer = params.writer;
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  if (params.pinned) q.pinned = params.pinned;
  if (params.has_deadline !== undefined) q.has_deadline = params.has_deadline;
  if (params.sort) q.sort = params.sort;
  if (params.page) q.page = params.page;
  if (params.size) q.size = params.size;
  if (params.deadline_from) q.deadline_from = params.deadline_from;
  if (params.deadline_to) q.deadline_to = params.deadline_to;
  return q;
}

function toSearchParams(
  obj: Record<string, string | string[] | number | boolean>,
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, String(v));
    } else {
      sp.append(key, String(value));
    }
  }
  return sp;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function realListArticles(
  params: ArticleQuery,
): Promise<ArticleListResponse> {
  return request<ArticleListResponse>(
    `/articles?${toSearchParams(buildQuery(params)).toString()}`,
  );
}

async function realGetArticle(id: number): Promise<Article> {
  return request<Article>(`/articles/${id}`);
}

async function realLookupArticles(ids: number[]): Promise<LookupResponse> {
  return request<LookupResponse>(`/articles/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

async function realListCategories(): Promise<Category[]> {
  return request<Category[]>(`/categories`);
}

async function realListWriters(q?: string, limit?: number): Promise<Writer[]> {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (limit) sp.set("limit", String(limit));
  return request<Writer[]>(`/writers?${sp.toString()}`);
}

// Lazy-load mock module only when needed (avoids importing mock data in real mode)
async function mock() {
  return await import("../mock/handlers");
}

export type ApiClient = {
  listArticles: (params: ArticleQuery) => Promise<ArticleListResponse>;
  getArticle: (id: number) => Promise<Article>;
  lookupArticles: (ids: number[]) => Promise<LookupResponse>;
  listCategories: () => Promise<Category[]>;
  listWriters: (q?: string, limit?: number) => Promise<Writer[]>;
};

const realApi: ApiClient = {
  listArticles: realListArticles,
  getArticle: realGetArticle,
  lookupArticles: realLookupArticles,
  listCategories: realListCategories,
  listWriters: realListWriters,
};

const mockApi: ApiClient = {
  listArticles: async (p) => (await mock()).mockListArticles(p),
  getArticle: async (id) => (await mock()).mockGetArticle(id),
  lookupArticles: async (ids) => (await mock()).mockLookupArticles(ids),
  listCategories: async () => (await mock()).mockListCategories(),
  listWriters: async (q, limit) => (await mock()).mockListWriters(q, limit),
};

/** Backend/mock is chosen once here; callers never branch on it. */
export const api: ApiClient = USE_MOCK ? mockApi : realApi;

/** ICS feed URL for the given favorite article ids (max 100). */
export function calendarFeedUrl(ids: number[]): string {
  const picked = ids.slice(0, 100);
  if (picked.length === 0) return "";
  return `${API_BASE}/calendar?${picked.map((id) => `id=${id}`).join("&")}`;
}
