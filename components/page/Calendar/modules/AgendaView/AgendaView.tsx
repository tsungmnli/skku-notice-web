"use client";

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Stack, Text, Group, ActionIcon, Center, Button } from "@mantine/core";
import {
  IconStar,
  IconExternalLink,
  IconChevronUp,
  IconChevronDown,
  IconCalendarEvent,
  IconLoader2,
  IconAlertCircle,
  IconBuilding,
} from "@tabler/icons-react";
import type { ScopeFilter } from "../ScopeSwitch";
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

const COLLAPSE_THRESHOLD = 4;

function buildDayGroups(
  articles: Article[],
  deptIdSet?: Set<number>,
  sortDeptFirst?: boolean,
): DayGroup[] {
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
      if (sortDeptFirst && deptIdSet) {
        const aDept = deptIdSet.has(a.id);
        const bDept = deptIdSet.has(b.id);
        if (aDept && !bDept) return -1;
        if (!aDept && bDept) return 1;
      }
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
  isDept?: boolean;
  showDeptMarker?: boolean;
  isToday?: boolean;
  isTomorrow?: boolean;
};

function AgendaRow({
  article,
  isFavorite,
  onToggleFavorite,
  isPast,
  isDept,
  showDeptMarker,
  isToday,
  isTomorrow,
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
      data-today={isToday || undefined}
      data-tomorrow={isTomorrow || undefined}
      data-urgent={isToday || isTomorrow || undefined}
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
          {isDept && showDeptMarker && article.department_name && (
            <span className={classes.deptBadge}>
              <IconBuilding size={11} className={classes.deptBadgeIcon} />
              {article.department_name}
            </span>
          )}
        </Group>
      </div>
    </article>
  );
}

function SkeletonBar() {
  return <div className={classes.skeletonBar} aria-hidden="true" />;
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
  onBackToToday: () => void;
  allFilteredOut: boolean;
  todayStr: string;
  deptIdSet?: Set<number>;
  scopeNotice?: React.ReactNode;
  noItemsInWindow?: boolean;
  activeScope?: ScopeFilter;
  hasDepts?: boolean;
  onSwitchScope?: (scope: ScopeFilter) => void;
  pastLoadToken?: number;
  filterKey?: string;
  showDeptMarkerPerRow?: boolean;
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
    onBackToToday,
    allFilteredOut,
    todayStr,
    deptIdSet,
    scopeNotice,
    noItemsInWindow,
    activeScope,
    hasDepts,
    onSwitchScope,
    pastLoadToken,
    filterKey,
    showDeptMarkerPerRow,
  },
  ref,
) {
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const internalRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const lastPastTokenRef = useRef<number | undefined>(pastLoadToken);
  const lastFilterKeyRef = useRef<string | undefined>(filterKey);

  const toggleCollapse = useCallback((dateStr: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  const groups = buildDayGroups(articles, deptIdSet, activeScope === "all");

  // A1: Preserve scroll position only when load-past extends the window.
  // On scope/filter changes, only scroll up to the top of the agenda when the
  // user is already scrolled into the list; otherwise leave the page alone.
  useLayoutEffect(() => {
    const el = internalRef.current;
    if (!el) return;

    if (
      filterKey !== undefined &&
      filterKey !== lastFilterKeyRef.current
    ) {
      lastFilterKeyRef.current = filterKey;
      lastPastTokenRef.current = pastLoadToken;
      prevHeightRef.current = el.scrollHeight;
      const stickyH = typeof window !== "undefined"
        ? parseFloat(
            getComputedStyle(document.documentElement)
              .getPropertyValue("--calendar-sticky-h")
              .trim(),
          ) || 40
        : 40;
      const offset = var_headerH() + stickyH + 8;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      // 목록 안으로 스크롤해 내려온 경우에만 목록 맨 위로 올린다.
      // 아직 목록 위쪽(제목/필터 영역)을 보고 있다면 화면을 움직이지 않는다.
      if (window.scrollY > top) {
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      }
      return;
    }

    if (
      pastLoadToken !== undefined &&
      pastLoadToken !== lastPastTokenRef.current &&
      prevHeightRef.current > 0
    ) {
      lastPastTokenRef.current = pastLoadToken;
      const heightDiff = el.scrollHeight - prevHeightRef.current;
      if (heightDiff > 0) window.scrollBy(0, heightDiff);
      prevHeightRef.current = el.scrollHeight;
      return;
    }

    prevHeightRef.current = el.scrollHeight;
  });

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

  if (error && articles.length === 0) {
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

  if (noItemsInWindow && groups.length === 0 && !loading) {
    const isDeptScope = activeScope === "dept";
    return (
      <Center p={40}>
        <Stack align="center" gap="sm">
          <IconCalendarEvent size={36} color="var(--mantine-color-gray-4)" />
          <Text size="sm" c="dimmed" ta="center">
            {isDeptScope
              ? "이 기간에 학과 마감 공지가 없습니다"
              : "이 기간에 표시할 공지가 없습니다"}
          </Text>
          <Group gap="xs">
            {isDeptScope && hasDepts && onSwitchScope && (
              <Button
                variant="light"
                size="sm"
                color="skku-green"
                onClick={() => onSwitchScope("all")}
              >
                모두 보기
              </Button>
            )}
            <Button variant="subtle" size="sm" onClick={onLoadMore}>
              다음 30일 보기
            </Button>
            {hasPast && (
              <Button
                variant="subtle"
                size="compact-xs"
                onClick={onBackToToday}
              >
                오늘로
              </Button>
            )}
          </Group>
        </Stack>
      </Center>
    );
  }

  const tomorrowStr = dayjs
    .tz(todayStr, SEOUL_TZ)
    .add(1, "day")
    .format("YYYY-MM-DD");

  return (
    <div ref={setRef} className={classes.agenda}>
      {scopeNotice}

      {/* Top controls: load past + back to today */}
      {(hasPast || loading) && (
        <div className={classes.listControls}>
          {hasPast && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onLoadPast}
              leftSection={<IconChevronUp size={16} />}
              loading={loading}
              className={classes.loadMoreBtn}
            >
              이전 30일
            </Button>
          )}
          {hasPast && (
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={onBackToToday}
              className={classes.todayLink}
            >
              오늘로
            </Button>
          )}
        </div>
      )}

      {/* Inline skeleton at top while loading past */}
      {loading && articles.length > 0 && hasPast && <SkeletonBar />}

      {groups.map((group) => {
        const isPast = group.dateStr < todayStr;
        const isToday = group.dateStr === todayStr;
        const isTomorrow = group.dateStr === tomorrowStr;
        const isLarge = group.articles.length > COLLAPSE_THRESHOLD;
        const collapsed = collapsedDays.has(group.dateStr);

        const deptItems =
          activeScope === "all" && deptIdSet
            ? group.articles.filter((a) => deptIdSet.has(a.id))
            : [];
        const campusItems =
          activeScope === "all" && deptIdSet
            ? group.articles.filter((a) => !deptIdSet.has(a.id))
            : [];

        let visibleArticles: Article[];
        let hiddenCount = 0;
        if (isLarge && collapsed) {
          if (activeScope === "all" && deptItems.length > 0) {
            visibleArticles = deptItems;
            hiddenCount = campusItems.length;
          } else {
            visibleArticles = group.articles.slice(0, COLLAPSE_THRESHOLD);
            hiddenCount = group.articles.length - COLLAPSE_THRESHOLD;
          }
        } else {
          visibleArticles = group.articles;
        }

        // B5: split count in "모두" view
        const showSplit =
          activeScope === "all" &&
          deptIdSet &&
          deptItems.length > 0 &&
          campusItems.length > 0;

        return (
          <section
            key={group.dateStr}
            id={`day-${group.dateStr}`}
            className={classes.daySection}
          >
            <div
              className={classes.dayHeader}
              data-past={isPast || undefined}
              data-today={isToday || undefined}
            >
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="sm" fw={700} className={classes.dayLabel}>
                  {group.label}
                </Text>
                {isToday && (
                  <span className={classes.todayTag} aria-label="오늘">
                    오늘
                  </span>
                )}
              </Group>
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="xs" c="dimmed" className={classes.dayCount}>
                  {showSplit ? (
                    <>
                      <span className={classes.deptCountText}>
                        내 학과 {deptItems.length}
                      </span>
                      {" · "}
                      <span>학교 {campusItems.length}</span>
                    </>
                  ) : (
                    `${group.articles.length}건`
                  )}
                </Text>
                {isLarge && (
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => toggleCollapse(group.dateStr)}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? "펼치기" : "접기"}
                    className={classes.collapseBtn}
                  >
                    {collapsed ? (
                      <IconChevronDown size={14} />
                    ) : (
                      <IconChevronUp size={14} />
                    )}
                  </ActionIcon>
                )}
              </Group>
            </div>
            <Stack gap={0}>
              {showSplit && deptItems.length > 0 && (
                <div className={classes.subGroupLabel}>
                  <IconBuilding
                    size={10}
                    className={classes.subGroupIcon}
                  />
                  <span>내 학과</span>
                </div>
              )}
              {(() => {
                const firstCampusIdx = showSplit
                  ? visibleArticles.findIndex((a) => !deptIdSet?.has(a.id))
                  : -1;
                return visibleArticles.map((article, idx) => {
                  const isDeptItem = deptIdSet?.has(article.id);
                  const showDivider = showSplit && idx === firstCampusIdx;

                  return (
                    <div key={article.id}>
                      {showDivider && (
                        <div className={classes.deptCampusDivider}>
                          <span>학교 공지</span>
                        </div>
                      )}
                      <AgendaRow
                        article={article}
                        isFavorite={isFavorite(article.id)}
                        onToggleFavorite={onToggleFavorite}
                        isPast={isPast}
                        isDept={isDeptItem}
                        showDeptMarker={showDeptMarkerPerRow}
                        isToday={isToday}
                        isTomorrow={isTomorrow}
                      />
                    </div>
                  );
                });
              })()}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  className={classes.moreBtn}
                  onClick={() => toggleCollapse(group.dateStr)}
                  aria-expanded={!collapsed}
                >
                  +{hiddenCount}건 더 보기
                </button>
              )}
            </Stack>
          </section>
        );
      })}

      {/* Inline skeleton at bottom while loading more */}
      {loading && articles.length > 0 && <SkeletonBar />}

      {/* Bottom controls: load more + back to today */}
      <div className={classes.listControls}>
        <Button
          variant="subtle"
          size="sm"
          onClick={onLoadMore}
          leftSection={<IconChevronDown size={16} />}
          loading={loading}
          className={classes.loadMoreBtn}
        >
          다음 30일
        </Button>
        {hasPast && (
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={onBackToToday}
            className={classes.todayLink}
          >
            오늘로
          </Button>
        )}
      </div>
    </div>
  );
});

function var_headerH(): number {
  if (typeof window === "undefined") return 56;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-h")
    .trim();
  return parseFloat(v) || 56;
}
