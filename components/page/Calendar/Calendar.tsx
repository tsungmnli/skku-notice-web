"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Stack, Group, Text, Button, Alert } from "@mantine/core";
import {
  IconAlertCircle,
  IconInfoCircle,
  IconBuilding,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import dayjs from "dayjs";
import { useFavorites } from "@/hooks/useFavorites";
import { useDepartments } from "@/hooks/useDepartments";
import { useDeptSelection } from "@/hooks/useDeptSelection";
import { buildScopes, hasSelection } from "@/lib/departments/selection";
import { useCalendarPrefs } from "./hooks/useCalendarPrefs";
import { useCalendarArticles } from "./hooks/useCalendarArticles";
import { useCalendarScope } from "./hooks/useCalendarScope";
import { ScopeSwitch } from "./modules/ScopeSwitch";
import { FilterBar } from "./modules/FilterBar";
import { MiniCalendar } from "./modules/MiniCalendar";
import { AgendaView } from "./modules/AgendaView";
import { CATEGORY_CODES } from "@/utils/constants";
import { parseSeoul, SEOUL_TZ, todayInSeoul } from "@/utils/date";
import classes from "./Calendar.module.css";

export function CalendarClient() {
  const { prefs, hydrated, update, reset } = useCalendarPrefs();
  const { departments } = useDepartments();
  const { selection, hydrated: deptHydrated } = useDeptSelection();
  const selectionActive = deptHydrated && hasSelection(selection);
  const scope = useMemo(() => {
    if (!selectionActive) return undefined;
    return buildScopes(selection, departments).all;
  }, [selection, departments, selectionActive]);

  const {
    articles,
    deptIdSet,
    campusCount,
    deptCount,
    loading,
    error,
    deptError,
    campusError,
    window,
    loadMore,
    loadPast,
    jumpToDate,
    backToToday,
    hasPast,
  } = useCalendarArticles(scope, selectionActive);

  const { scope: activeScope, setScope } = useCalendarScope(
    selection,
    deptHydrated,
  );
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const agendaRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => todayInSeoul().format("YYYY-MM-DD"), []);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Scope-filtered articles (before category/favorite filtering)
  const scopeFiltered = useMemo(() => {
    if (activeScope === "dept") {
      return articles.filter((a) => deptIdSet.has(a.id));
    }
    if (activeScope === "campus") {
      return articles.filter((a) => !deptIdSet.has(a.id));
    }
    return articles;
  }, [articles, deptIdSet, activeScope]);

  // Category/favorite-filtered articles
  const filteredArticles = useMemo(() => {
    if (!hydrated) return [];
    const hiddenSet = new Set(prefs.hidden_categories);
    const favSet = new Set(favorites);
    return scopeFiltered.filter((a) => {
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      const visible = cats.some((c) => !hiddenSet.has(c));
      if (!visible) return false;
      if (prefs.favorites_only && !favSet.has(a.id)) return false;
      return true;
    });
  }, [
    scopeFiltered,
    prefs.hidden_categories,
    prefs.favorites_only,
    favorites,
    hydrated,
  ]);

  // Category counts in current window (before category/favorite filtering, after scope filtering)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of scopeFiltered) {
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      for (const c of cats) {
        counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    return counts;
  }, [scopeFiltered]);

  const favoritesCount = useMemo(() => {
    const favSet = new Set(favorites);
    return scopeFiltered.filter((a) => favSet.has(a.id)).length;
  }, [scopeFiltered, favorites]);

  // Day metadata for mini calendar (from filtered articles)
  const dayMetaMap = useMemo(() => {
    const map = new Map<
      string,
      {
        dateStr: string;
        count: number;
        categories: string[];
        deptCount: number;
      }
    >();
    for (const a of filteredArticles) {
      if (!a.deadline_at) continue;
      const dateStr = parseSeoul(a.deadline_at).format("YYYY-MM-DD");
      const isDept = deptIdSet.has(a.id);
      const existing = map.get(dateStr);
      const cats = a.categories.length > 0 ? a.categories : ["general"];
      if (existing) {
        existing.count++;
        if (isDept) existing.deptCount++;
        for (const c of cats) {
          if (!existing.categories.includes(c)) existing.categories.push(c);
        }
      } else {
        map.set(dateStr, {
          dateStr,
          count: 1,
          categories: [...cats],
          deptCount: isDept ? 1 : 0,
        });
      }
    }
    return map;
  }, [filteredArticles, deptIdSet]);

  // Weekly summary (computed from already-loaded data)
  const weeklySummary = useMemo(() => {
    if (!hydrated || loading) return null;
    const today = todayInSeoul().startOf("day");
    const weekEnd = today.add(7, "day");
    let total = 0;
    let deptTotal = 0;
    for (const a of filteredArticles) {
      if (!a.deadline_at) continue;
      const d = parseSeoul(a.deadline_at).startOf("day");
      if (d.isBefore(today) || d.isAfter(weekEnd)) continue;
      total++;
      if (deptIdSet.has(a.id)) deptTotal++;
    }
    if (total === 0) return null;
    return { total, deptTotal };
  }, [filteredArticles, deptIdSet, hydrated, loading]);

  const allFilteredOut =
    hydrated &&
    !loading &&
    scopeFiltered.length > 0 &&
    filteredArticles.length === 0;

  const noItemsInWindow =
    !loading &&
    scopeFiltered.length === 0 &&
    !error &&
    !(activeScope === "dept" && !selectionActive);

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
      const date = dayjs.tz(dateStr, SEOUL_TZ);
      const inWindow =
        date.isAfter(window.from.subtract(1, "day")) &&
        date.isBefore(window.to.add(1, "day"));
      if (!inWindow) {
        jumpToDate(date);
        return;
      }
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

  // Partial error notice (inline, above agenda)
  const scopeNotice = useMemo(() => {
    if (deptError && !campusError) {
      return (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          variant="light"
          className={classes.inlineNotice}
        >
          학과 마감 공지를 불러오지 못했습니다. 학교 전체 공지만 표시됩니다.
        </Alert>
      );
    }
    if (campusError && !deptError && selectionActive) {
      return (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          variant="light"
          className={classes.inlineNotice}
        >
          학교 전체 마감 공지를 불러오지 못했습니다. 학과 공지만 표시됩니다.
        </Alert>
      );
    }
    if (activeScope === "all" && !selectionActive && deptHydrated) {
      return (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          variant="light"
          className={classes.inlineNotice}
        >
          선택한 학과가 없어 학교 전체 공지만 표시됩니다.{" "}
          <Link href="/dept/edit" className={classes.inlineLink}>
            학과 선택하기
          </Link>
        </Alert>
      );
    }
    return null;
  }, [deptError, campusError, activeScope, selectionActive, deptHydrated]);

  // Empty state for "no departments selected" on dept/all scope
  const noDeptSelected =
    deptHydrated &&
    !selectionActive &&
    (activeScope === "dept" || activeScope === "all");

  if (error) {
    return (
      <div className={classes.pageContainer}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      </div>
    );
  }

  // Override the AgendaView content when no departments are selected and scope is "dept"
  if (noDeptSelected && activeScope === "dept" && !loading) {
    return (
      <div className={classes.pageContainer}>
        <Stack gap="md">
          <Group
            justify="space-between"
            align="center"
            className={classes.topBar}
          >
            <div>
              <Text fw={700} size="lg">
                마감 캘린더
              </Text>
              <Text size="xs" c="dimmed">
                {window.from.format("YYYY.MM.DD")} ~{" "}
                {window.to.format("YYYY.MM.DD")}
              </Text>
            </div>
            {hasPast && (
              <Button variant="subtle" size="sm" onClick={backToToday}>
                오늘로 돌아가기
              </Button>
            )}
          </Group>

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

          <div className={classes.layout}>
            <div className={classes.agendaCol}>
              <div className={classes.emptyDept}>
                <Stack align="center" gap="md">
                  <IconBuilding size={40} className={classes.emptyIcon} />
                  <Stack align="center" gap={4}>
                    <Text fw={600} size="sm">
                      선택한 학과가 없습니다
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      내 학과 마감 공지를 보려면 학과를 선택해 주세요
                    </Text>
                  </Stack>
                  <Link href="/dept/edit">
                    <Button
                      variant="light"
                      color="skku-green"
                      size="sm"
                      leftSection={<IconBuilding size={16} />}
                    >
                      학과 선택하기
                    </Button>
                  </Link>
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    onClick={() => setScope("campus")}
                  >
                    학교 전체 보기
                  </Button>
                </Stack>
              </div>
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

  const filterBarEl = hydrated ? (
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
  ) : null;

  return (
    <div className={classes.pageContainer}>
      <Stack gap="sm">
        {/* Sticky top bar with scope switch + today jump */}
        <div className={classes.stickyTop}>
          <Group
            justify="space-between"
            align="center"
            className={classes.topBar}
            wrap="nowrap"
            gap="sm"
          >
            <div className={classes.titleBlock}>
              <Text fw={700} size="lg">
                마감 캘린더
              </Text>
              <Text size="xs" c="dimmed" className={classes.dateRange}>
                {window.from.format("YYYY.MM.DD")} ~{" "}
                {window.to.format("YYYY.MM.DD")}
              </Text>
            </div>
            <Group gap="sm" align="center" wrap="nowrap">
              {hasPast && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  onClick={backToToday}
                  className={classes.todayLink}
                >
                  오늘로
                </Button>
              )}
              <ScopeSwitch
                value={activeScope}
                onChange={setScope}
                hasDepts={selectionActive}
                deptCount={deptCount}
                campusCount={campusCount}
              />
            </Group>
          </Group>

          {/* Weekly summary (inline, computed from loaded data) */}
          {weeklySummary && (
            <Text size="xs" c="dimmed" className={classes.weeklySummary}>
              이번 주 마감 {weeklySummary.total}건
              {selectionActive && weeklySummary.deptTotal > 0
                ? ` · 내 학과 ${weeklySummary.deptTotal}건`
                : ""}
            </Text>
          )}
        </div>

        {/* Desktop: filters always visible.
            Mobile: compact collapsible region with filters + mini calendar */}
        <div className={classes.desktopFilters}>{filterBarEl}</div>

        <div className={classes.mobileControls}>
          <button
            type="button"
            className={classes.controlsToggle}
            onClick={() => setControlsOpen((o) => !o)}
            aria-expanded={controlsOpen}
          >
            <span>
              {controlsOpen ? "필터 · 달력 접기" : "필터 · 달력 펼치기"}
            </span>
            <IconChevronDown
              size={16}
              style={{
                transform: controlsOpen ? "rotate(180deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          </button>
          {controlsOpen && (
            <div className={classes.mobileControlsContent}>
              {filterBarEl}
              <MiniCalendar
                dayMetaMap={dayMetaMap}
                onDayClick={handleDayClick}
                activeDateStr={null}
                showDeptMarker={activeScope === "all" && selectionActive}
              />
            </div>
          )}
        </div>

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
              onBackToToday={backToToday}
              allFilteredOut={allFilteredOut}
              todayStr={todayStr}
              deptIdSet={deptIdSet}
              scopeNotice={scopeNotice}
              noItemsInWindow={noItemsInWindow}
              activeScope={activeScope}
              hasDepts={selectionActive}
              onSwitchScope={setScope}
            />
          </div>

          <aside className={classes.sideCol}>
            <MiniCalendar
              dayMetaMap={dayMetaMap}
              onDayClick={handleDayClick}
              activeDateStr={null}
              showDeptMarker={activeScope === "all" && selectionActive}
            />
            {activeScope === "all" && selectionActive && (
              <div className={classes.legend}>
                <span className={classes.legendItem}>
                  <span className={classes.legendRing} />
                  <Text size="xs" c="dimmed">
                    테두리 = 내 학과 마감일
                  </Text>
                </span>
                <span className={classes.legendItem}>
                  <IconBuilding size={12} className={classes.legendIcon} />
                  <Text size="xs" c="dimmed">
                    내 학과 공지가 위에 표시
                  </Text>
                </span>
              </div>
            )}
          </aside>
        </div>
      </Stack>
    </div>
  );
}
