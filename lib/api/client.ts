import type {
  Article,
  ArticleListResponse,
  ArticleQuery,
  Category,
  LookupResponse,
  Writer,
  Detail,
  LoginBody,
  LoginResponse,
  RegisterBody,
  User,
} from "./types";
import { ApiError } from "./errors";
import { safeNext } from "@/lib/auth/safeNext";
import { isMockMode } from "@/lib/auth/config";

export { ApiError } from "./errors";

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/** Single source of truth for the backend base URL. */
export const API_BASE = ENV_API_BASE || "http://localhost:8000/api/v1";

// Mock is opt-in. The rule lives in lib/auth/config.ts (single source of truth):
// falling back to mock when API_BASE is missing is a dev-only convenience, so a
// forgotten env var in production fails loudly instead of silently serving fake data.
const USE_MOCK = isMockMode;

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

/** 게이트웨이(502/503/504)나 CDN(429)이 내려주는 HTML 같은 JSON 아닌 본문이 사용자에게 그대로 보이지 않게 한다. */
function fallbackMessage(status: number): string {
  if (status === 429)
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (status >= 500) {
    return "서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.";
  }
  return `요청 실패 (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError("네트워크 연결을 확인해 주세요.", 0);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: { detail?: unknown; code?: unknown } = {};

    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        body = parsed as { detail?: unknown; code?: unknown };
      }
    } catch {
      body = {};
    }

    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new ApiError(
      typeof body.detail === "string"
        ? body.detail
        : fallbackMessage(res.status),
      res.status,
      typeof body.code === "string"
        ? body.code
        : res.status === 429
          ? "rate_limited" // ingress/Cloudflare 가 직접 내려주는 429 도 대기 안내를 띄운다
          : undefined,
      retryAfter !== undefined && Number.isFinite(retryAfter)
        ? retryAfter
        : undefined,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function authRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return request<T>(path, { ...init, headers, credentials: "include" });
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

// 서버는 한 번에 1~200개만 받는다(그 밖은 422). 즐겨찾기가 많아도 화면이 깨지지 않게 나눠서 보낸다.
const LOOKUP_MAX_IDS = 200;

async function realLookupArticles(ids: number[]): Promise<LookupResponse> {
  const unique = [...new Set(ids)];
  const chunks: number[][] = [];
  for (let i = 0; i < unique.length; i += LOOKUP_MAX_IDS) {
    chunks.push(unique.slice(i, i + LOOKUP_MAX_IDS));
  }
  const parts = await Promise.all(
    chunks.map((chunk) =>
      request<LookupResponse>(`/articles/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk }),
      }),
    ),
  );
  return {
    items: parts.flatMap((p) => p.items),
    missing_ids: parts.flatMap((p) => p.missing_ids),
  };
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

async function realRegister(body: RegisterBody): Promise<Detail> {
  return authRequest<Detail>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function realVerifyEmail(token: string): Promise<Detail> {
  return authRequest<Detail>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

async function realResendVerification(email: string): Promise<Detail> {
  return authRequest<Detail>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

async function realLogin(body: LoginBody): Promise<LoginResponse> {
  return authRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function realLogout(): Promise<void> {
  return authRequest<void>("/auth/logout", { method: "POST" });
}

async function realForgotPassword(email: string): Promise<Detail> {
  return authRequest<Detail>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

async function realResetPassword(
  token: string,
  password: string,
): Promise<Detail> {
  return authRequest<Detail>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

async function realGetMe(): Promise<User> {
  return authRequest<User>("/me");
}

async function realDeleteMe(password?: string): Promise<void> {
  return authRequest<void>("/me", {
    method: "DELETE",
    body: password === undefined ? undefined : JSON.stringify({ password }),
  });
}

// Lazy-load mock module only when needed (avoids importing mock data in real mode).
// 조건은 lib/auth/config.ts 의 isMockMode 와 같은 규칙이지만, 일부러 process.env 를 직접 적는다:
// Next 가 빌드 때 NEXT_PUBLIC_* 와 NODE_ENV 를 리터럴로 바꿔야 번들러가 production 에서 이 분기와
// mock 모듈(import)을 통째로 버린다. isMockMode 변수를 거치면 그 제거가 보장되지 않는다.
// (deploy.yml 스모크 테스트가 번들에 mock 이 없는지 확인한다.)
async function mock() {
  if (
    process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
    (!process.env.NEXT_PUBLIC_API_BASE && process.env.NODE_ENV !== "production")
  ) {
    return await import("../mock/handlers");
  }
  throw new Error("mock API is not available in this build");
}

export type ApiClient = {
  listArticles: (params: ArticleQuery) => Promise<ArticleListResponse>;
  getArticle: (id: number) => Promise<Article>;
  lookupArticles: (ids: number[]) => Promise<LookupResponse>;
  listCategories: () => Promise<Category[]>;
  listWriters: (q?: string, limit?: number) => Promise<Writer[]>;
  register: (body: RegisterBody) => Promise<Detail>;
  verifyEmail: (token: string) => Promise<Detail>;
  resendVerification: (email: string) => Promise<Detail>;
  login: (body: LoginBody) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<Detail>;
  resetPassword: (token: string, password: string) => Promise<Detail>;
  getMe: () => Promise<User>;
  deleteMe: (password?: string) => Promise<void>;
  googleLogin: () => Promise<LoginResponse>;
  googleLoginUrl: (next?: string) => string;
};

const realApi: ApiClient = {
  listArticles: realListArticles,
  getArticle: realGetArticle,
  lookupArticles: realLookupArticles,
  listCategories: realListCategories,
  listWriters: realListWriters,
  register: realRegister,
  verifyEmail: realVerifyEmail,
  resendVerification: realResendVerification,
  login: realLogin,
  logout: realLogout,
  forgotPassword: realForgotPassword,
  resetPassword: realResetPassword,
  getMe: realGetMe,
  deleteMe: realDeleteMe,
  googleLogin: () => {
    throw new Error("googleLogin은 mock 모드에서만 사용합니다.");
  },
  googleLoginUrl,
};

const mockApi: ApiClient = {
  listArticles: async (p) => (await mock()).mockListArticles(p),
  getArticle: async (id) => (await mock()).mockGetArticle(id),
  lookupArticles: async (ids) => (await mock()).mockLookupArticles(ids),
  listCategories: async () => (await mock()).mockListCategories(),
  listWriters: async (q, limit) => (await mock()).mockListWriters(q, limit),
  register: async (body) => (await mock()).mockRegister(body),
  verifyEmail: async (token) => (await mock()).mockVerifyEmail(token),
  resendVerification: async (email) =>
    (await mock()).mockResendVerification(email),
  login: async (body) => (await mock()).mockLogin(body),
  logout: async () => (await mock()).mockLogout(),
  forgotPassword: async (email) => (await mock()).mockForgotPassword(email),
  resetPassword: async (token, password) =>
    (await mock()).mockResetPassword(token, password),
  getMe: async () => (await mock()).mockGetMe(),
  deleteMe: async (password) => (await mock()).mockDeleteMe(password),
  googleLogin: async () => (await mock()).mockGoogleLogin(),
  googleLoginUrl,
};

/** Backend/mock is chosen once here; callers never branch on it. */
export function googleLoginUrl(next?: string): string {
  const safePath = safeNext(next);
  if (USE_MOCK) {
    return `/login?mock_google=1&next=${encodeURIComponent(safePath)}`;
  }
  return `${API_BASE}/auth/google?next=${encodeURIComponent(safePath)}`;
}

export const api: ApiClient = USE_MOCK ? mockApi : realApi;

/** ICS feed URL for the given favorite article ids (max 100). */
export function calendarFeedUrl(ids: number[]): string {
  const picked = ids.slice(0, 100);
  if (picked.length === 0) return "";
  return `${API_BASE}/calendar?${picked.map((id) => `id=${id}`).join("&")}`;
}
