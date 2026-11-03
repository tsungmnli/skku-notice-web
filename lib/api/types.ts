export type Article = {
  id: number;
  article_no: number;
  title: string;
  writer: string;
  posted_on: string; // "YYYY-MM-DD"
  display_no: number | null;
  is_pinned: boolean;
  view_count: number | null;
  url: string;
  categories: string[];
  deadline_at: string | null; // ISO 8601
  event_at: string | null; // ISO 8601, 행사/근무일 시각
  deadline_source: "title" | "body" | null;
};

export type ArticleListResponse = {
  items: Article[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
};

export type Category = {
  code: string;
  name: string;
  count: number;
};

export type Writer = {
  writer: string;
  count: number;
};

export type LookupResponse = {
  items: Article[];
  missing_ids: number[];
};

export type SortKey =
  "posted_desc" | "posted_asc" | "views_desc" | "deadline_asc";
export type PinnedFilter = "include" | "exclude" | "only";

export type ArticleQuery = {
  q?: string;
  category?: string[];
  writer?: string[];
  date_from?: string;
  date_to?: string;
  pinned?: PinnedFilter;
  has_deadline?: boolean;
  sort?: SortKey;
  page?: number;
  size?: number;
  deadline_from?: string;
  deadline_to?: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  has_password: boolean;
  google_linked: boolean;
  created_at: string;
};

export type LoginResponse = {
  user: User;
  token: string | null;
  expires_at: string;
};

export type Detail = {
  detail: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  name?: string;
  turnstile_token?: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type ResetPasswordBody = {
  token: string;
  password: string;
};

export type DeleteMeBody = {
  password?: string;
};

export type AuthErrorCode =
  | "invalid_token"
  | "captcha_failed"
  | "invalid_client"
  | "not_authenticated"
  | "invalid_credentials"
  | "email_not_verified"
  | "reauth_required"
  | "origin_not_allowed"
  | "google_disabled"
  | "google_conflict"
  | "payload_too_large"
  | "rate_limited";
