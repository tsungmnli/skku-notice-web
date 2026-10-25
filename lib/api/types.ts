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
