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

export function todayInSeoul(): dayjs.Dayjs {
  return dayjs.tz(new Date(), SEOUL_TZ);
}

export function toSeoulDateStr(d: dayjs.Dayjs): string {
  return d.tz(SEOUL_TZ).format("YYYY-MM-DD");
}
