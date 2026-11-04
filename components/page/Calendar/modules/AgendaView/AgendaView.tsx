"use client";

import { forwardRef } from "react";
import { Stack, Text, Group, ActionIcon, Center, Button } from "@mantine/core";
import {
  IconStar,
  IconExternalLink,
  IconChevronUp,
  IconChevronDown,
  IconCalendarEvent,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import type { Article } from "@/lib/api/types";
import { SEOUL_TZ, computeDDay, parseSeoul } from "@/utils/date";
import { categoryColor } from "@/lib/calendar/categories";
import { categoryLabel } from "@/utils/constants";
import classes from "./AgendaView.module.css";

type DayGroup = {
  dateStr: string;
  label: string;
  subLabel: string;
  articles: Article[];
};

function buildDayGroups(articles: Article[]): DayGroup[] {
  const today = dayjs.tz(new Date(), SEOUL_TZ).startOf("day");
  const currentYear = today.year();
  const map = new Map<string, Article[]>();

  for (const a of articles) {
    if (!a.deadline_at) continue;
    const d = parseSeoul(a.deadline_at);
    const dateStr = d.format("YYYY-MM-DD");
    const arr = map.get(dateStr) ?? [];
    arr.push(a);
    map.set(dateStr, arr);
  }

  const groups: DayGroup[] = [];
  for (const [dateStr, items] of map) {
    const d = dayjs.tz(dateStr, SEOUL_TZ);
    const weekdayKr = ["일", "월", "화", "수", "목", "금", "토"][d.day()];
    const dateLabel = d.format("M/D");
    const yearPrefix = d.year() !== currentYear ? `${d.year()}년 ` : "";

    let prefix: string;
    const diff = d.startOf("day").diff(today, "day");
    if (diff === 0) prefix = "오늘";
    else if (diff === 1) prefix = "내일";
    else if (diff === -1) prefix = "어제";
    else prefix = "";

    const sorted = [...items].sort((a, b) => {
      const ta = parseSeoul(a.deadline_at!);
      const tb = parseSeoul(b.deadline_at!);
      const aUnknown = ta.hour() === 23 && ta.minute() === 59;
      const bUnknown = tb.hour() === 23 && tb.minute() === 59;
      if (aUnknown && !bUnknown) return 1;
      if (!aUnknown && bUnknown) return -1;
      return ta.valueOf() - tb.valueOf();
    });

    groups.push({
      dateStr,
      label: prefix
        ? `${prefix} · ${yearPrefix}${dateLabel}(${weekdayKr})`
        : `${yearPrefix}${dateLabel}(${weekdayKr})`,
      subLabel: weekdayKr,
      articles: sorted,
    });
  }

  groups.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  return groups;
}

function DeadlinePill({ deadlineAt }: { deadlineAt: string }) {
  const info = computeDDay(deadlineAt);
  if (!info) return null;

  let className = classes.pill;
  let style: React.CSSProperties = {};

  if (info.passed) {
    className = `${classes.pill} ${classes.pillPassed}`;
  } else if (info.days <= 3) {
    className = `${classes.pill} ${classes.pillUrgent}`;
    style = { background: "#dc2626", color: "#fff" };
  } else if (info.days <= 7) {
    className = `${classes.pill} ${classes.pillSoon}`;
    style = { background: "#d28a23", color: "#fff" };
  }

  return (
    <span className={className} style={style}>
      {info.label}
    </span>
  );
}

type RowProps = {
  article: Article;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  isPast: boolean;
};

function AgendaRow({
  article,
  isFavorite,
  onToggleFavorite,
  isPast,
}: RowProps) {
  const time = article.deadline_at
    ? (() => {
        const d = parseSeoul(article.deadline_at);
        if (d.hour() === 23 && d.minute() === 59) return null;
        return d.format("HH:mm");
      })()
    : null;

  const primaryCat = article.categories[0] ?? "general";

  return (
    <article
      className={classes.row}
      data-past={isPast || undefined}
      style={{ borderLeftColor: categoryColor(primaryCat) }}
    >
      <ActionIcon
        variant="subtle"
        color={isFavorite ? "yellow" : "gray"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(article.id);
        }}
        aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        aria-pressed={isFavorite}
        size="sm"
        className={classes.starBtn}
      >
        <IconStar size={16} fill={isFavorite ? "currentColor" : "none"} />
      </ActionIcon>

      <div className={classes.rowBody}>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.titleLink}
        >
          <span className={classes.title}>{article.title}</span>
          <IconExternalLink size={13} className={classes.externalIcon} />
        </a>
        <Group gap="xs" align="center" wrap="wrap" className={classes.meta}>
          {time && (
            <Text size="xs" c="dimmed" className={classes.time}>
              {time}
            </Text>
          )}
          <DeadlinePill deadlineAt={article.deadline_at!} />
          <Group gap={4} wrap="nowrap">
            {article.categories.slice(0, 2).map((code) => (
              <span
                key={code}
                className={classes.catTag}
                style={{
                  borderColor: categoryColor(code),
                  color: categoryColor(code),
                }}
              >
                {categoryLabel(code)}
              </span>
            ))}
          </Group>
          <Text size="xs" c="dimmed" className={classes.writer}>
            {article.writer}
          </Text>
        </Group>
      </div>
    </article>
  );
}

type Props = {
  articles: Article[];
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (id: number) => void;
  loading: boolean;
  error: string | null;
  hasPast: boolean;
  onLoadPast: () => void;
  onLoadMore: () => void;
  onResetFilters: () => void;
  allFilteredOut: boolean;
  todayStr: string;
};

export const AgendaView = forwardRef<HTMLDivElement, Props>(function AgendaView(
  {
    articles,
    isFavorite,
    onToggleFavorite,
    loading,
    error,
    hasPast,
    onLoadPast,
    onLoadMore,
    onResetFilters,
    allFilteredOut,
    todayStr,
  },
  ref,
) {
  const groups = buildDayGroups(articles);

  if (loading && articles.length === 0) {
    return (
      <Center p={40}>
        <Stack align="center" gap="sm">
          <IconLoader2 size={28} className={classes.spinner} />
          <Text size="sm" c="dimmed">
            불러오는 중...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={40}>
        <Stack align="center" gap="sm">
          <IconAlertCircle size={28} color="var(--mantine-color-red-6)" />
          <Text size="sm" c="dimmed">
            {error}
          </Text>
          <Button variant="subtle" size="sm" onClick={onLoadMore}>
            다시 시도
          </Button>
        </Stack>
      </Center>
    );
  }

  if (allFilteredOut && !loading) {
    return (
      <Center p={40}>
        <Stack align="center" gap="sm">
          <IconCalendarEvent size={36} color="var(--mantine-color-gray-4)" />
          <Text size="sm" c="dimmed">
            선택한 필터에 해당하는 공지가 없습니다
          </Text>
          <Button
            variant="light"
            size="sm"
            color="skku-green"
            onClick={onResetFilters}
          >
            필터 초기화
          </Button>
        </Stack>
      </Center>
    );
  }

  if (groups.length === 0 && !loading) {
    return (
      <Center p={40}>
        <Stack align="center" gap="sm">
          <IconCalendarEvent size={36} color="var(--mantine-color-gray-4)" />
          <Text size="sm" c="dimmed">
            이 기간에 표시할 공지가 없습니다
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div ref={ref} className={classes.agenda}>
      {hasPast && (
        <Button
          variant="subtle"
          size="sm"
          fullWidth
          onClick={onLoadPast}
          leftSection={<IconChevronUp size={16} />}
          className={classes.loadMoreBtn}
        >
          이전 30일 보기
        </Button>
      )}

      {groups.map((group) => {
        const isPast = group.dateStr < todayStr;
        return (
          <section
            key={group.dateStr}
            id={`day-${group.dateStr}`}
            className={classes.daySection}
          >
            <div className={classes.dayHeader} data-past={isPast || undefined}>
              <Text size="sm" fw={700} className={classes.dayLabel}>
                {group.label}
              </Text>
              <Text size="xs" c="dimmed" className={classes.dayCount}>
                {group.articles.length}건
              </Text>
            </div>
            <Stack gap={0}>
              {group.articles.map((article) => (
                <AgendaRow
                  key={article.id}
                  article={article}
                  isFavorite={isFavorite(article.id)}
                  onToggleFavorite={onToggleFavorite}
                  isPast={isPast}
                />
              ))}
            </Stack>
          </section>
        );
      })}

      <Button
        variant="subtle"
        size="sm"
        fullWidth
        onClick={onLoadMore}
        leftSection={<IconChevronDown size={16} />}
        loading={loading}
        className={classes.loadMoreBtn}
      >
        다음 30일 보기
      </Button>
    </div>
  );
});
