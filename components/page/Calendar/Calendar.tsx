"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  ActionIcon,
  Switch,
  Drawer,
  Paper,
  ScrollArea,
  Center,
  Alert,
  Divider,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconCalendarEvent,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { ArticleCard } from "@/components/common/ArticleCard";
import { useFavorites } from "@/hooks/useFavorites";
import {
  useMonthDeadlines,
  groupByDate,
  isToday,
} from "./hooks/useMonthDeadlines";
import { SEOUL_TZ, computeDDay } from "@/utils/date";
import classes from "./Calendar.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(() =>
    dayjs.tz(new Date(), SEOUL_TZ),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const { deadlines, loading, error } = useMonthDeadlines(currentMonth);
  const deadlineMap = useMemo(() => groupByDate(deadlines), [deadlines]);
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const filteredDeadlineMap = useMemo(() => {
    if (!favOnly) return deadlineMap;
    const filtered = new Map<string, typeof deadlines>();
    for (const [date, articles] of deadlineMap) {
      const favArticles = articles.filter((a) => favSet.has(a.id));
      if (favArticles.length > 0) filtered.set(date, favArticles);
    }
    return filtered;
  }, [deadlineMap, favOnly, favSet]);

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startWeekday = startOfMonth.day();
    const days: (dayjs.Dayjs | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 0; d < endOfMonth.date(); d++)
      days.push(startOfMonth.add(d, "day"));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const selectedArticles = useMemo(() => {
    if (!selectedDate) return [];
    return filteredDeadlineMap.get(selectedDate) || [];
  }, [selectedDate, filteredDeadlineMap]);

  // Scroll detail into view on mobile when selecting a day
  useEffect(() => {
    if (selectedDate && detailRef.current && typeof window !== "undefined") {
      const isMobile = window.matchMedia("(max-width: 47.99em)").matches;
      if (isMobile) {
        detailRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedDate]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!gridRef.current?.contains(document.activeElement)) return;
      const activeEl = document.activeElement as HTMLElement;
      const cells = Array.from(
        gridRef.current.querySelectorAll<HTMLElement>("[data-date]"),
      );
      const idx = cells.indexOf(activeEl);
      if (idx === -1) return;

      let newIdx = idx;
      if (e.key === "ArrowRight") newIdx = Math.min(idx + 1, cells.length - 1);
      else if (e.key === "ArrowLeft") newIdx = Math.max(idx - 1, 0);
      else if (e.key === "ArrowDown")
        newIdx = Math.min(idx + 7, cells.length - 1);
      else if (e.key === "ArrowUp") newIdx = Math.max(idx - 7, 0);
      else return;

      e.preventDefault();
      cells[newIdx]?.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [calendarDays]);

  const monthLabel = currentMonth.format("YYYY년 M월");
  const goPrevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const goNextMonth = () => setCurrentMonth((m) => m.add(1, "month"));
  const goToday = () => {
    setCurrentMonth(dayjs.tz(new Date(), SEOUL_TZ));
    setSelectedDate(null);
  };

  const handleDayClick = (dateStr: string) => setSelectedDate(dateStr);

  const renderDayCell = (day: dayjs.Dayjs, idx: number) => {
    const dateStr = day.format("YYYY-MM-DD");
    const articles = filteredDeadlineMap.get(dateStr) || [];
    const count = articles.length;
    const today = isToday(day);
    const isWeekend = day.day() === 0 || day.day() === 6;
    const isSelected = selectedDate === dateStr;

    // Check for imminent deadlines (0-3 days)
    const hasImminent = articles.some((a) => {
      if (!a.deadline_at) return false;
      const info = computeDDay(a.deadline_at);
      return info && !info.passed && info.days <= 3;
    });

    return (
      <button
        key={idx}
        className={classes.dayCell}
        data-date={dateStr}
        data-today={today || undefined}
        data-selected={isSelected || undefined}
        data-weekend={isWeekend || undefined}
        data-has-deadline={count > 0 || undefined}
        data-imminent={hasImminent || undefined}
        onClick={() => count > 0 && handleDayClick(dateStr)}
        disabled={count === 0}
        aria-label={`${dateStr}${count > 0 ? `, 마감 ${count}건` : ""}`}
      >
        <span className={classes.dayNumber}>{day.date()}</span>
        {count > 0 && (
          <div className={classes.dayContent}>
            {/* Desktop: show up to 2 title previews */}
            <div className={classes.titlesPreview}>
              {articles.slice(0, 2).map((a) => (
                <span key={a.id} className={classes.titlePreview}>
                  {a.title}
                </span>
              ))}
              {count > 2 && (
                <span className={classes.moreCount}>+{count - 2}개 더보기</span>
              )}
            </div>
            {/* Mobile: dot + count only */}
            <span className={classes.dotContainer}>
              <span className={classes.dot} />
              {count > 1 && <span className={classes.dotCount}>{count}</span>}
            </span>
          </div>
        )}
      </button>
    );
  };

  const detailPanel = (
    <Stack gap={0} className={classes.detailPanel}>
      <Group
        justify="space-between"
        align="center"
        className={classes.detailHeader}
      >
        <Text fw={600} size="sm">
          {selectedDate
            ? `${dayjs(selectedDate, "YYYY-MM-DD").format("M월 D일")} 마감 공지`
            : "날짜를 선택하세요"}
        </Text>
        {selectedDate && (
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setSelectedDate(null)}
            aria-label="닫기"
          >
            닫기
          </Button>
        )}
      </Group>
      <Divider />
      <ScrollArea.Autosize mah="60vh">
        {selectedArticles.length > 0 ? (
          <Stack gap={0}>
            {selectedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isFavorite={isFavorite(article.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </Stack>
        ) : (
          <Center p={20}>
            <Text size="sm" c="dimmed">
              {selectedDate
                ? "이 날의 마감 공지가 없습니다"
                : "마감일이 있는 날짜를 클릭하면 공지가 표시됩니다"}
            </Text>
          </Center>
        )}
      </ScrollArea.Autosize>
    </Stack>
  );

  return (
    <div className={classes.pageContainer}>
      <Stack gap="md">
        {/* Top controls */}
        <Group
          justify="space-between"
          align="center"
          className={classes.header}
        >
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              onClick={goPrevMonth}
              aria-label="이전 달"
              className={classes.monthBtn}
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Text fw={700} size="lg" className={classes.monthLabel}>
              {monthLabel}
            </Text>
            <ActionIcon
              variant="subtle"
              onClick={goNextMonth}
              aria-label="다음 달"
              className={classes.monthBtn}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
          <Group gap="sm">
            <Switch
              size="xs"
              label="즐겨찾기만"
              checked={favOnly}
              onChange={(e) => setFavOnly(e.currentTarget.checked)}
              color="skku-green"
              disabled={favorites.length === 0}
            />
            <Button variant="subtle" size="xs" onClick={goToday}>
              오늘
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Desktop: 2-column layout */}
        <div className={classes.desktopLayout}>
          <Paper withBorder radius="md" className={classes.calendarPaper} p={0}>
            <div className={classes.weekdayRow}>
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={classes.weekdayCell}
                  data-weekend={i === 0 || i === 6}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className={classes.dayGrid} ref={gridRef}>
              {calendarDays.map((day, i) =>
                day ? (
                  renderDayCell(day, i)
                ) : (
                  <div key={i} className={classes.emptyCell} />
                ),
              )}
            </div>
          </Paper>

          {/* Desktop detail panel (right) */}
          <div className={classes.detailDesktop} ref={detailRef}>
            {selectedDate ? (
              detailPanel
            ) : (
              <div className={classes.detailPlaceholder}>{detailPanel}</div>
            )}
          </div>
        </div>

        {loading && (
          <Text size="xs" c="dimmed" ta="center">
            마감일을 불러오는 중...
          </Text>
        )}

        {!loading && deadlines.length === 0 && !error && (
          <Center p={20}>
            <Stack align="center" gap="sm">
              <IconCalendarEvent
                size={36}
                color="var(--mantine-color-gray-4)"
              />
              <Text size="sm" c="dimmed">
                이 달에 마감일이 있는 공지가 없습니다
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Mobile drawer for selected day */}
      <Drawer
        opened={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDate
            ? `${dayjs(selectedDate, "YYYY-MM-DD").format("M월 D일")} 마감 공지`
            : ""
        }
        position="bottom"
        size="auto"
        className={classes.mobileDrawer}
        styles={{
          content: { maxWidth: "720px", margin: "0 auto" },
        }}
      >
        <ScrollArea.Autosize mah="50vh">
          {selectedArticles.length > 0 ? (
            <Stack gap={0}>
              {selectedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isFavorite={isFavorite(article.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </Stack>
          ) : (
            <Center p={20}>
              <Text size="sm" c="dimmed">
                이 날의 마감 공지가 없습니다
              </Text>
            </Center>
          )}
        </ScrollArea.Autosize>
      </Drawer>
    </div>
  );
}
