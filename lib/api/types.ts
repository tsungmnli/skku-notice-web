export type Article = {
  id: number;
  article_no: number;
  source: string;
  source_name: string;
  department: string;
  department_name: string;
  title: string;
  writer: string;
  posted_on: string; // "YYYY-MM-DD"
  display_no: number | null;
  is_pinned: boolean;
  view_count: number | null;
  url: string;
  has_attachment: boolean;
  categories: string[];
  deadline_at: string | null; // ISO 8601
  event_at: string | null; // 행사/근무일. 시각을 알면 ISO 8601, 모르면 날짜만 ("2026-11-20")
  deadline_source: "title" | "body" | null;
  deadline_has_time: boolean;
  event_has_time: boolean;
  content_changed_at: string | null; // ISO 8601 +09:00
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

export type ArticleScope = {
  department?: string[];
  source?: string[];
};

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
} & ArticleScope;

export type CalendarPrefs = {
  hidden_categories: string[];
  favorites_only: boolean;
};

export type UserPreferences = {
  calendar: CalendarPrefs | null;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  has_password: boolean;
  google_linked: boolean;
  created_at: string;
  preferences?: UserPreferences;
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

export type Source = {
  slug: string;
  name: string;
  level: "all" | "undergrad" | "grad";
  common: boolean;
  count: number;
};

export type Department = {
  code: string;
  name: string;
  kind: "college" | "department";
  college: string | null;
  count: number;
  sources: Source[];
  board_url?: string | null;
};

export type Status = {
  sources: { slug: string; last_crawled_at: string | null; delayed: boolean }[];
};

export type ReadItem = {
  article_id: number;
  read_at: string;
};

export type ReadsResponse = {
  items: ReadItem[];
};

export type ReadsSaved = {
  saved: number;
};
