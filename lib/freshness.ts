import type { Article } from "./api/types";
import { todayInSeoul, toSeoulDateStr } from "../utils/date";

export const WINDOW_DAYS = 7;

export type ReadRecord = { article_id: number; read_at: string };

export function windowStart(today: ReturnType<typeof todayInSeoul>): string {
  return toSeoulDateStr(today.subtract(WINDOW_DAYS - 1, "day"));
}

export function computeSince(windowStartStr: string, baseline: string): string {
  return baseline > windowStartStr ? baseline : windowStartStr;
}

export function badgeFor(
  article: Article,
  read: ReadRecord | null,
  since: string,
): "NEW" | "UPDATED" | null {
  const isNew = article.posted_on >= since && !read;
  if (isNew) return "NEW";

  if (
    article.content_changed_at != null &&
    article.content_changed_at.slice(0, 10) >= since &&
    (!read || new Date(read.read_at) < new Date(article.content_changed_at))
  ) {
    return "UPDATED";
  }

  return null;
}
