"use client";

import { useCallback, useMemo, useRef } from "react";
import { Stack, Group, Text, Button, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useFavorites } from "@/hooks/useFavorites";
import { useCalendarPrefs } from "./hooks/useCalendarPrefs";
import { useCalendarArticles } from "./hooks/useCalendarArticles";
import { FilterBar } from "./modules/FilterBar";
import { MiniCalendar } from "./modules/MiniCalendar";
import { AgendaView } from "./modules/AgendaView";
import { CATEGORY_CODES } from "@/utils/constants";
import { SEOUL_TZ, todayInSeoul } from "@/utils/date";
import classes from "./Calendar.module.css";

export function CalendarClient() {
  const { prefs, hydrated, update, reset } = useCalendarPrefs();
  const {
    articles,
    loading,
    error,
    window,
    loadMore,
    loadPast,
    jumpToDate,
    backToToday,
    hasPast,
  } = useCalendarArticles();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const agendaRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => todayInSeoul().format("YYYY-MM-DD"), []);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    if (!hydrated) return [];
    const hiddenSet = new Set(prefs.hidden_categories);
    const favSet = new Set(favorites);
    return articles.filter((a) => {
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      const visible = cats.some((c) => !hiddenSet.has(c));
      if (!visible) return false;
      if (prefs.favorites_only && !favSet.has(a.id)) return false;
      return true;
    });
  }, [articles, prefs.hidden_categories, prefs.favorites_only, favorites, hydrated]);

  // Category counts in current window (before filtering)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      for (const c of cats) {
        counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    return counts;
  }, [articles]);

  const favoritesCount = useMemo(() => {
    const favSet = new Set(favorites);
    return articles.filter((a) => favSet.has(a.id)).length;
  }, [articles, favorites]);

  // Day metadata for mini calendar (from filtered articles)
  const dayMetaMap = useMemo(() => {
    const map = new Map<string, { dateStr: string; count: number; categories: string[] }>();
    for (const a of filteredArticles) {
      if (!a.deadline_at) continue;
      const dateStr = dayjs.tz(a.deadline_at, SEOUL_TZ).format("YYYY-MM-DD");
      const existing = map.get(dateStr);
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      if (existing) {
        existing.count++;
        for (const c of cats) {
          if (!existing.categories.includes(c)) existing.categories.push(c);
        }
      } else {
        map.set(dateStr, { dateStr, count: 1, categories: [...cats] });
      }
    }
    return map;
  }, [filteredArticles]);

  const allFilteredOut =
    hydrated &&
    !loading &&
    articles.length > 0 &&
    filteredArticles.length === 0;

  // Handlers
  const handleToggleCategory = useCallback(
    (code: string) => {
      const hidden = prefs.hidden_categories;
      const next = hidden.includes(code)
        ? hidden.filter((c) => c !== code)
        : [...hidden, code];
      update({ hidden_categories: next });
    },
    [prefs.hidden_categories, update],
  );

  const handleToggleFavoritesOnly = useCallback(() => {
    update({ favorites_only: !prefs.favorites_only });
  }, [prefs.favorites_only, update]);

  const handleAllOn = useCallback(() => {
    update({ hidden_categories: [] });
  }, [update]);

  const handleAllOff = useCallback(() => {
    update({ hidden_categories: [...CATEGORY_CODES] });
  }, [update]);

  const handleDayClick = useCallback(
    (dateStr: string) => {
      // If date is outside loaded window, jump to it
      const date = dayjs.tz(dateStr, SEOUL_TZ);
      const inWindow =
        date.isAfter(window.from.subtract(1, "day")) &&
        date.isBefore(window.to.add(1, "day"));
      if (!inWindow) {
        jumpToDate(date);
        return;
      }
      // Scroll to the day section, or the next day that has items
      const sortedDates = [...dayMetaMap.keys()].sort();
      const target = sortedDates.find((d) => d >= dateStr);
      if (target) {
        const el = document.getElementById(`day-${target}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [dayMetaMap, jumpToDate, window.from, window.to],
  );

  if (error) {
    return (
      <div className={classes.pageContainer}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className={classes.pageContainer}>
      <Stack gap="md">
        {/* Top controls */}
        <Group justify="space-between" align="center" className={classes.topBar}>
          <div>
            <Text fw={700} size="lg">마감 캘린더</Text>
            <Text size="xs" c="dimmed">
              {window.from.format("YYYY.MM.DD")} ~ {window.to.format("YYYY.MM.DD")}
            </Text>
          </div>
          {hasPast && (
            <Button variant="subtle" size="sm" onClick={backToToday}>
              오늘로 돌아가기
            </Button>
          )}
        </Group>

        {/* Filter bar */}
        {hydrated && (
          <FilterBar
            favoritesOnly={prefs.favorites_only}
            hiddenCategories={prefs.hidden_categories}
            counts={categoryCounts}
            favoritesCount={favoritesCount}
            onToggleFavoritesOnly={handleToggleFavoritesOnly}
            onToggleCategory={handleToggleCategory}
            onAllOn={handleAllOn}
            onAllOff={handleAllOff}
          />
        )}

        {/* Main layout: agenda + side panel */}
        <div className={classes.layout}>
          <div className={classes.agendaCol}>
            <AgendaView
              ref={agendaRef}
              articles={filteredArticles}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              loading={loading}
              error={null}
              hasPast={hasPast}
              onLoadPast={loadPast}
              onLoadMore={loadMore}
              onResetFilters={reset}
              allFilteredOut={allFilteredOut}
              todayStr={todayStr}
            />
          </div>

          <aside className={classes.sideCol}>
            <MiniCalendar
              dayMetaMap={dayMetaMap}
              onDayClick={handleDayClick}
              activeDateStr={null}
            />
          </aside>
        </div>
      </Stack>
    </div>
  );
}
