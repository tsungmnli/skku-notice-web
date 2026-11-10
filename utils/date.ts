import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const SEOUL_TZ = "Asia/Seoul";

// "T"/공백 뒤에 시각이 있고 끝이 Z 또는 ±HH[:MM] 인 문자열. 날짜만 있는 "2026-11-08"은 제외.
const HAS_UTC_OFFSET = /[T ].*(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * 서버가 내려주는 ISO 8601 문자열을 서울 시각의 dayjs로 변환한다.
 *
 * `dayjs.tz(str, tz)`는 오프셋이 붙은 문자열("...+09:00", "...Z")을 UTC로 환산한 뒤
 * 그 시계 값을 그대로 서울 시각으로 읽어서 9시간이 빠진다 (23:59+09:00 → 14:59).
 * 오프셋이 있으면 절대 시각으로 파싱한 뒤 서울로 변환하고, 없으면 서울 시각으로 간주한다.
 */
export function parseSeoul(iso: string): dayjs.Dayjs {
  return HAS_UTC_OFFSET.test(iso)
    ? dayjs(iso).tz(SEOUL_TZ)
    : dayjs.tz(iso, SEOUL_TZ);
}

/** "YYYY-MM-DD" 형식이면서 실제로 있는 날짜인지 ("2026-02-31"은 false). 서버는 없는 날짜를 422 로 거절한다. */
export function isIsoDate(value: string): boolean {
  return dayjs(value, "YYYY-MM-DD", true).isValid();
}

/** "2026-11-08"처럼 시각 부분이 아예 없는 문자열인지. */
function isDateOnly(iso: string): boolean {
  return !/[T ]\d{1,2}:\d{2}/.test(iso);
}

/** 서버는 시각을 못 읽은 마감을 23:59(KST)로 내려준다. 이 경우 시각을 표시하지 않는다. */
function isTimeUnknown(iso: string, d: dayjs.Dayjs): boolean {
  return isDateOnly(iso) || (d.hour() === 23 && d.minute() === 59);
}

export type DDayInfo = {
  days: number;
  passed: boolean;
  label: string;
};

/** Compute D-day in Asia/Seoul. 당일은 마감 시간 유무와 상관없이 항상 "D-day". */
export function computeDDay(deadlineAt: string | null): DDayInfo | null {
  if (!deadlineAt) return null;
  const dl = parseSeoul(deadlineAt);

  const now = dayjs.tz(new Date(), SEOUL_TZ);
  const today = now.startOf("day");
  const dlDay = dl.startOf("day");
  const diff = dlDay.diff(today, "day");

  let label: string;
  if (diff > 0) {
    label = `D-${diff}`;
  } else if (diff === 0) {
    label = "D-day";
  } else {
    label = `D+${Math.abs(diff)}`;
  }

  return { days: diff, passed: diff < 0, label };
}

export function formatSeoulDate(dateStr: string): string {
  return parseSeoul(dateStr).format("YYYY.MM.DD");
}

export function formatPostedOn(dateStr: string): string {
  return dayjs(dateStr, "YYYY-MM-DD").format("YYYY.MM.DD");
}

export function formatDeadline(
  deadlineAt: string | null,
  hasTime?: boolean,
): string {
  if (!deadlineAt) return "";
  const dl = parseSeoul(deadlineAt);
  if (hasTime === false || isTimeUnknown(deadlineAt, dl)) {
    return dl.format("YYYY.MM.DD");
  }
  return dl.format("YYYY.MM.DD HH:mm");
}

export function formatEventAt(
  eventAt: string | null,
  hasTime?: boolean,
): string {
  if (!eventAt) return "";
  const ev = parseSeoul(eventAt);
  if (hasTime === false || isTimeUnknown(eventAt, ev)) {
    return ev.format("YYYY.MM.DD");
  }
  return ev.format("YYYY.MM.DD HH:mm");
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
