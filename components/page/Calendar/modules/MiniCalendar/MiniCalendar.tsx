"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Button, Group, Text, Collapse } from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { todayInSeoul } from "@/utils/date";
import { categoryColor } from "@/lib/calendar/categories";
import classes from "./MiniCalendar.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type DayMeta = {
  dateStr: string;
  count: number;
  categories: string[];
};

type Props = {
  dayMetaMap: Map<string, DayMeta>;
  onDayClick: (dateStr: string) => void;
  activeDateStr: string | null;
};

export function MiniCalendar({ dayMetaMap, onDayClick, activeDateStr }: Props) {
  const [month, setMonth] = useState(() => todayInSeoul().startOf("month"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const today = todayInSeoul().startOf("day");

  const days = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startWeekday = start.day();
    const cells: (dayjs.Dayjs | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 0; d < end.date(); d++) cells.push(start.add(d, "day"));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const handleDayClick = useCallback(
    (dateStr: string) => {
      onDayClick(dateStr);
    },
    [onDayClick],
  );

  // Keyboard navigation
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
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const date = activeEl.dataset.date;
        if (date) handleDayClick(date);
        return;
      } else return;
      e.preventDefault();
      cells[newIdx]?.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [days, handleDayClick]);

  const monthLabel = month.format("YYYY년 M월");

  const content = (
    <div className={classes.mini}>
      <Group justify="space-between" align="center" className={classes.header}>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => setMonth((m) => m.subtract(1, "month"))}
            aria-label="이전 달"
            size="sm"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Text fw={700} size="sm" className={classes.monthLabel}>
            {monthLabel}
          </Text>
          <ActionIcon
            variant="subtle"
            onClick={() => setMonth((m) => m.add(1, "month"))}
            aria-label="다음 달"
            size="sm"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => {
            setMonth(todayInSeoul().startOf("month"));
          }}
        >
          오늘
        </Button>
      </Group>

      <div className={classes.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={classes.weekdayCell}
            data-weekend={i === 0 || i === 6}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={classes.dayGrid} ref={gridRef}>
        {days.map((day, i) => {
          if (!day) return <div key={i} className={classes.emptyCell} />;
          const dateStr = day.format("YYYY-MM-DD");
          const meta = dayMetaMap.get(dateStr);
          const isToday = day.isSame(today, "day");
          const isWeekend = day.day() === 0 || day.day() === 6;
          const isActive = activeDateStr === dateStr;
          const hasItems = meta && meta.count > 0;
          const dots = (meta?.categories ?? []).slice(0, 3);

          return (
            <button
              key={i}
              className={classes.dayCell}
              data-date={dateStr}
              data-today={isToday || undefined}
              data-weekend={isWeekend || undefined}
              data-active={isActive || undefined}
              data-has-items={hasItems || undefined}
              onClick={() => handleDayClick(dateStr)}
              aria-label={`${dateStr}${hasItems ? `, 마감 ${meta!.count}건` : ", 마감 없음"}`}
              aria-pressed={isActive}
            >
              <span className={classes.dayNumber}>{day.date()}</span>
              {hasItems && (
                <span className={classes.dots} aria-hidden="true">
                  {dots.map((cat) => (
                    <span
                      key={cat}
                      className={classes.dot}
                      style={{ background: categoryColor(cat) }}
                    />
                  ))}
                  {meta!.count > 3 && (
                    <span className={classes.dotMore}>+{meta!.count - 3}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={classes.wrapper}>
      {/* Desktop: always visible */}
      <div className={classes.desktop}>{content}</div>

      {/* Mobile: collapsible */}
      <div className={classes.mobile}>
        <Button
          variant="subtle"
          size="sm"
          fullWidth
          onClick={() => setMobileOpen((o) => !o)}
          rightSection={
            <IconChevronDown
              size={16}
              style={{
                transform: mobileOpen ? "rotate(180deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          }
        >
          {monthLabel}
        </Button>
        <Collapse expanded={mobileOpen}>{content}</Collapse>
      </div>
    </div>
  );
}
