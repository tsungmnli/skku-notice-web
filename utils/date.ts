import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const SEOUL_TZ = "Asia/Seoul";

export type DDayInfo = {
  days: number;
  passed: boolean;
  label: string;
};

/** Compute D-day in Asia/Seoul. If time is 23:59, treat as date-only ("당일 마감"). */
export function computeDDay(deadlineAt: string | null): DDayInfo | null {
  if (!deadlineAt) return null;
  const dl = dayjs.tz(deadlineAt, SEOUL_TZ);
  const hour = dl.hour();
  const minute = dl.minute();
  const timeUnknown = hour === 23 && minute === 59;

  const now = dayjs.tz(new Date(), SEOUL_TZ);
  const today = now.startOf("day");
  const dlDay = dl.startOf("day");
  const diff = dlDay.diff(today, "day");

  let label: string;
  if (diff > 0) {
    label = `D-${diff}`;
  } else if (diff === 0) {
    label = timeUnknown ? "당일 마감" : "D-day";
  } else {
    label = `D+${Math.abs(diff)}`;
  }

  return { days: diff, passed: diff < 0, label };
}

export function formatPostedOn(dateStr: string): string {
  return dayjs(dateStr, "YYYY-MM-DD").format("YYYY.MM.DD");
}

export function formatDeadline(deadlineAt: string | null): string {
  if (!deadlineAt) return "";
  const dl = dayjs.tz(deadlineAt, SEOUL_TZ);
  const hour = dl.hour();
  const minute = dl.minute();
  if (hour === 23 && minute === 59) {
    return dl.format("YYYY.MM.DD");
  }
  return dl.format("YYYY.MM.DD HH:mm");
}

export function formatEventAt(eventAt: string | null): string {
  if (!eventAt) return "";
  return dayjs.tz(eventAt, SEOUL_TZ).format("YYYY.MM.DD HH:mm");
}

export function todayInSeoul(): dayjs.Dayjs {
  return dayjs.tz(new Date(), SEOUL_TZ);
}

export function toSeoulDateStr(d: dayjs.Dayjs): string {
  return d.tz(SEOUL_TZ).format("YYYY-MM-DD");
}

/**
 * 빠른 마감 기간 필터. 모두 "오늘"부터 시작하는 롤링 구간이라 지난 마감이 섞이지 않고,
 * 선택 상태는 URL의 `due` 키로 저장한다 (날짜 범위를 역추적해 판정하지 않는다).
 */
export const QUICK_DUE_OPTIONS = [
  { key: "today", label: "오늘 마감", days: 0 },
  { key: "7d", label: "7일 내", days: 6 },
  { key: "30d", label: "30일 내", days: 29 },
] as const;

export type QuickDueKey = (typeof QUICK_DUE_OPTIONS)[number]["key"];

export function isQuickDueKey(value: string | null): value is QuickDueKey {
  return QUICK_DUE_OPTIONS.some((o) => o.key === value);
}

/** 서울 기준 오늘부터 `days`일 뒤까지(포함)의 날짜 범위. */
export function getDueRange(
  key: QuickDueKey,
  now: Date = new Date(),
): { from: string; to: string } {
  const option = QUICK_DUE_OPTIONS.find((o) => o.key === key)!;
  const today = dayjs.tz(now, SEOUL_TZ).startOf("day");
  return {
    from: toSeoulDateStr(today),
    to: toSeoulDateStr(today.add(option.days, "day")),
  };
}
