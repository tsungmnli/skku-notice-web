"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Center,
  Group,
  Stack,
  Text,
  Badge,
  Tooltip,
} from "@mantine/core";
import {
  IconSchool,
  IconExternalLink,
  IconCalendarEvent,
  IconBellFilled,
  IconPencil,
} from "@tabler/icons-react";
import Link from "next/link";
import { useDepartments } from "@/hooks/useDepartments";
import { useDeptSelection } from "@/hooks/useDeptSelection";
import { useDeptSummaries, DEADLINE_SOON_DAYS } from "@/hooks/useDeptSummaries";
import {
  hasSelection,
  buildScopes,
  getActiveDept,
  setActiveDept,
} from "@/lib/departments/selection";
import { originLabel } from "@/lib/departments/labels";
import type { Article, ArticleScope } from "@/lib/api/types";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { NoticesClient } from "@/components/page/Notices";
import classes from "./Dept.module.css";

type SegKey = "all" | "dept" | "college";

export function DeptClient() {
  const { departments, colleges } = useDepartments();
  const { selection, hydrated } = useDeptSelection();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // null = URL에 d가 없음(첫 진입), "all" = 사용자가 명시적으로 '전체' 선택
  const dParam = searchParams.get("d");
  const segParam = searchParams.get("seg");
  const seg: SegKey =
    segParam === "dept" || segParam === "college" ? segParam : "all";

  const hasSelected = hydrated && hasSelection(selection);

  const departmentsByCode = useMemo(
    () => new Map(departments.map((d) => [d.code, d])),
    [departments],
  );

  const selectedDeptCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const code of selection.departments) codes.add(code);
    for (const slug of selection.sources) {
      const dept = departments.find((d) =>
        d.sources.some((s) => s.slug === slug),
      );
      if (dept) codes.add(dept.code);
    }
    return [...codes];
  }, [selection, departments]);

  const { summaries } = useDeptSummaries(
    selectedDeptCodes,
    departments,
    hydrated,
  );

  const activeDeptCode = useMemo(() => {
    if (!hasSelected || selectedDeptCodes.length === 0) return "all";
    if (dParam && dParam !== "all" && selectedDeptCodes.includes(dParam)) {
      return dParam;
    }
    if (selectedDeptCodes.length === 1) return selectedDeptCodes[0];
    // 마지막 학과 복원은 d 파라미터가 아예 없을 때만 (명시적 '전체'는 존중)
    if (dParam === null) {
      const remembered = getActiveDept();
      if (
        remembered &&
        remembered !== "all" &&
        selectedDeptCodes.includes(remembered)
      ) {
        return remembered;
      }
    }
    return "all";
  }, [hasSelected, selectedDeptCodes, dParam]);

  useEffect(() => {
    if (!hydrated || !hasSelected) return;
    const urlD = searchParams.get("d") || "all";
    if (activeDeptCode !== urlD) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeDeptCode === "all") {
        params.delete("d");
      } else {
        params.set("d", activeDeptCode);
      }
      params.delete("page");
      params.delete("seg");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    if (activeDeptCode !== "all") {
      setActiveDept(activeDeptCode);
    }
  }, [activeDeptCode, hydrated, hasSelected, searchParams, router, pathname]);

  const singleDeptScope = useCallback(
    (code: string): ArticleScope | null => {
      const dept = departmentsByCode.get(code);
      if (!dept) return null;
      // Whole-dept selection covers every board of the dept, so it wins over
      // any individually picked boards (same rule as the edit screen).
      const wholeDept = selection.departments.includes(code);
      const selectedSources = wholeDept
        ? []
        : selection.sources.filter((slug) =>
            dept.sources.some((s) => s.slug === slug),
          );
      const scope: ArticleScope = {};
      if (selectedSources.length > 0) {
        const common = dept.sources.find((s) => s.common);
        const slugs = new Set<string>(selectedSources);
        if (common) slugs.add(common.slug);
        scope.source = [...slugs];
      } else {
        scope.department = [code];
      }
      if (dept.college) {
        scope.department = [...(scope.department ?? []), dept.college];
      }
      return scope;
    },
    [departmentsByCode, selection.sources, selection.departments],
  );

  const scopes = useMemo(
    () => buildScopes(selection, departments),
    [selection, departments],
  );

  const activeScope: ArticleScope = useMemo(() => {
    if (activeDeptCode === "all" || !hasSelected) return scopes.all;
    const single = singleDeptScope(activeDeptCode);
    return single ?? scopes.all;
  }, [activeDeptCode, hasSelected, scopes.all, singleDeptScope]);

  const statusScope = scopes.all;

  const originOf = useCallback(
    (article: Article) => {
      if (activeDeptCode !== "all") {
        const articleDept = departmentsByCode.get(article.department);
        if (articleDept?.kind === "college") {
          return `단과대 · ${articleDept.name}`;
        }
        if (article.department !== activeDeptCode) {
          return article.department_name;
        }
        const activeDept = departmentsByCode.get(activeDeptCode);
        if (activeDept && activeDept.sources.length > 1) {
          return article.source_name;
        }
        return null;
      }
      return originLabel(article, departmentsByCode);
    },
    [activeDeptCode, departmentsByCode],
  );

  const handleTabChange = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("d", key);
      params.delete("page");
      params.delete("seg");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleSegChange = useCallback(
    (next: SegKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.delete("seg");
      } else {
        params.set("seg", next);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Active source filter is scoped to the dept it was chosen in, so it
  // resets automatically when the active dept changes (no effect needed).
  const [activeSource, setActiveSource] = useState<{
    dept: string;
    slug: string;
  } | null>(null);
  const activeSourceSlug =
    activeSource && activeSource.dept === activeDeptCode
      ? activeSource.slug
      : null;
  const setActiveSourceSlug = useCallback(
    (slug: string | null) => {
      setActiveSource(slug === null ? null : { dept: activeDeptCode, slug });
    },
    [activeDeptCode],
  );

  const activeDept =
    activeDeptCode !== "all" ? departmentsByCode.get(activeDeptCode) : null;
  const activeDeptHasCollege =
    activeDept?.college && departmentsByCode.has(activeDept.college);

  const activeDeptSelectedSources = useMemo(() => {
    if (!activeDept) return [];
    // Picking the whole dept means all of its boards (the edit screen shows
    // them all checked), so a multi-board dept gets one chip per board, same
    // as when every board is picked one by one. A single-board dept has
    // nothing to split.
    const wholeDept =
      selection.departments.includes(activeDept.code) &&
      activeDept.sources.length > 1;
    return activeDept.sources.filter(
      (s) => wholeDept || selection.sources.includes(s.slug),
    );
  }, [activeDept, selection]);

  // Build unified origin chips: merges seg (all/dept/college) + source filter
  type OriginChip = {
    key: string;
    label: string;
    active: boolean;
    onClick: () => void;
  };
  const originChips = useMemo<OriginChip[]>(() => {
    if (!activeDept) return [];
    const chips: OriginChip[] = [];
    const collegeName = activeDept.college
      ? (colleges.get(activeDept.college)?.name ?? "")
      : "";

    // "전체" — resets both seg and source filter
    const isAllActive = seg === "all" && !activeSourceSlug;
    chips.push({
      key: "all",
      label: "전체",
      active: isAllActive,
      onClick: () => {
        if (seg !== "all") handleSegChange("all");
        setActiveSourceSlug(null);
      },
    });

    // Department-level (not college, not specific source)
    if (activeDeptHasCollege) {
      chips.push({
        key: "dept",
        label: "학과",
        active: seg === "dept" && !activeSourceSlug,
        onClick: () => {
          handleSegChange("dept");
          setActiveSourceSlug(null);
        },
      });
    }

    // Common source (if exists and is selected)
    const commonSource = activeDeptSelectedSources.find((s) => s.common);
    if (commonSource) {
      chips.push({
        key: `source-${commonSource.slug}`,
        label: commonSource.name,
        active: activeSourceSlug === commonSource.slug,
        onClick: () => {
          if (seg !== "all") handleSegChange("all");
          setActiveSourceSlug(commonSource.slug);
        },
      });
    }

    // Each selected non-common source
    for (const source of activeDeptSelectedSources) {
      if (source.common) continue;
      chips.push({
        key: `source-${source.slug}`,
        label: source.name,
        active: activeSourceSlug === source.slug,
        onClick: () => {
          if (seg !== "all") handleSegChange("all");
          setActiveSourceSlug(source.slug);
        },
      });
    }

    // College chip (with actual college name)
    if (activeDeptHasCollege && collegeName) {
      chips.push({
        key: "college",
        label: collegeName,
        active: seg === "college",
        onClick: () => {
          handleSegChange("college");
          setActiveSourceSlug(null);
        },
      });
    }

    return chips;
  }, [
    activeDept,
    activeDeptHasCollege,
    activeDeptSelectedSources,
    seg,
    activeSourceSlug,
    colleges,
    handleSegChange,
    setActiveSourceSlug,
  ]);

  const activeSegScope: ArticleScope = useMemo(() => {
    if (activeDeptCode === "all" || !activeDept) return activeScope;
    if (seg === "college" && activeDept.college) {
      return { department: [activeDept.college] };
    }
    if (seg === "dept") {
      const scope: ArticleScope = {};
      const selectedSources = selection.departments.includes(activeDept.code)
        ? []
        : selection.sources.filter((slug) =>
            activeDept.sources.some((s) => s.slug === slug),
          );
      if (selectedSources.length > 0) {
        const common = activeDept.sources.find((s) => s.common);
        const slugs = new Set<string>(selectedSources);
        if (common) slugs.add(common.slug);
        scope.source = [...slugs];
      } else {
        scope.department = [activeDept.code];
      }
      if (activeSourceSlug) {
        scope.source = [activeSourceSlug];
      }
      return scope;
    }
    if (activeSourceSlug) {
      return { source: [activeSourceSlug] };
    }
    return activeScope;
  }, [
    activeDeptCode,
    activeDept,
    seg,
    activeScope,
    selection.sources,
    selection.departments,
    activeSourceSlug,
  ]);

  // Scroll active tab into view
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (activeTabRef.current && tabListRef.current) {
      const tab = activeTabRef.current;
      const container = tabListRef.current;
      const tabLeft = tab.offsetLeft;
      const tabRight = tabLeft + tab.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.offsetWidth;
      if (tabLeft < viewLeft) {
        container.scrollTo({ left: tabLeft - 8, behavior: "smooth" });
      } else if (tabRight > viewRight) {
        container.scrollTo({
          left: tabRight - container.offsetWidth + 8,
          behavior: "smooth",
        });
      }
    }
  }, [activeDeptCode]);

  // 훅은 조기 return 위에 둔다 (렌더마다 훅 개수가 같아야 함)
  // Aggregate summary for "전체" (combined) tab
  const aggregateSummary = useMemo(() => {
    let newCount = 0;
    let deadlineSoon = 0;
    for (const code of selectedDeptCodes) {
      const s = summaries.get(code);
      if (s) {
        newCount += s.newCount;
        deadlineSoon += s.deadlineSoon;
      }
    }
    return { newCount, deadlineSoon };
  }, [selectedDeptCodes, summaries]);

  if (!hydrated) {
    return (
      <div className={classes.pageContainer}>
        <Text size="sm" c="dimmed">
          불러오는 중...
        </Text>
      </div>
    );
  }

  if (!hasSelected) {
    return (
      <div className={classes.pageContainer}>
        <Center p={60} className={classes.emptyState}>
          <Stack align="center" gap="md">
            <IconSchool size={48} color="var(--mantine-color-gray-4)" />
            <Stack gap={4} align="center">
              <Text fw={700} size="lg">
                내 학과 공지
              </Text>
              <Text size="sm" c="dimmed" ta="center" maw={400}>
                보고 싶은 학과를 선택하면 해당 학과와 소속 단과대의 공지를 한
                곳에서 볼 수 있습니다.
              </Text>
            </Stack>
            <Button
              component={Link}
              href="/dept/edit"
              variant="filled"
              color="skku-green"
              size="md"
              leftSection={<IconPencil size={16} />}
            >
              학과 선택하기
            </Button>
          </Stack>
        </Center>
      </div>
    );
  }

  const showAllTab = selectedDeptCodes.length > 1;

  // Active dept summary for the info line
  const activeSummary = activeDept ? summaries.get(activeDept.code) : null;
  const activeCollegeName = activeDept?.college
    ? (colleges.get(activeDept.college)?.name ?? null)
    : null;

  const header = (
    <div className={classes.controlArea}>
      {/* Sticky bar: title + edit link + tab row */}
      <div className={classes.stickyBar}>
        <Group
          justify="space-between"
          align="center"
          className={classes.titleRow}
        >
          <Group gap={6} align="center">
            <IconSchool size={18} color="var(--accent-green)" />
            <Text fw={700} size="sm">
              학과 공지
            </Text>
          </Group>
          <Button
            component={Link}
            href="/dept/edit"
            variant="subtle"
            color="skku-green"
            size="compact-xs"
            leftSection={<IconPencil size={13} />}
            className={classes.editLink}
          >
            학과 편집
          </Button>
        </Group>

        {/* Department tabs — horizontal scroll with fade, no wrap */}
        <div className={classes.tabsScrollWrapper}>
          <div
            ref={tabListRef}
            className={classes.tabsRow}
            role="tablist"
            aria-label="학과 선택"
          >
            {showAllTab && (
              <button
                className={classes.tab}
                data-active={activeDeptCode === "all" || undefined}
                onClick={() => handleTabChange("all")}
                role="tab"
                aria-selected={activeDeptCode === "all"}
                aria-label="전체"
              >
                <span className={classes.tabLabel}>전체</span>
              </button>
            )}
            {selectedDeptCodes.map((code) => {
              const dept = departmentsByCode.get(code);
              if (!dept) return null;
              const isActive = activeDeptCode === code;
              const summary = summaries.get(code);
              return (
                <button
                  key={code}
                  ref={isActive ? activeTabRef : undefined}
                  className={classes.tab}
                  data-active={isActive || undefined}
                  onClick={() => handleTabChange(code)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${dept.name}${summary ? `, 새 글 ${summary.newCount}, 마감 임박 ${summary.deadlineSoon}` : ""}`}
                  title={dept.name}
                >
                  <span className={classes.tabLabel}>{dept.name}</span>
                  {summary && (
                    <span className={classes.tabBadges}>
                      {summary.newCount > 0 && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="skku-green"
                          radius="xl"
                          className={classes.tabBadge}
                          aria-hidden
                        >
                          {summary.newCount}
                        </Badge>
                      )}
                      {summary.deadlineSoon > 0 && (
                        <span className={classes.tabDeadline} aria-hidden>
                          <IconCalendarEvent size={11} />
                          {summary.deadlineSoon}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className={classes.tabsFadeLeft} aria-hidden />
          <div className={classes.tabsFadeRight} aria-hidden />
        </div>
      </div>

      {/* Focal summary block + origin chips */}
      <Stack gap="xs" className={classes.belowSticky}>
        {/* Focal dept summary block */}
        <div className={classes.summaryBlock}>
          <Group
            justify="space-between"
            align="center"
            className={classes.summaryTopLine}
          >
            <Text size="xs" c="dimmed" fw={500}>
              {activeDept
                ? (activeCollegeName ?? " ")
                : `${selectedDeptCodes.length}개 학과 선택됨`}
            </Text>
            {activeDept?.board_url && (
              <a
                href={activeDept.board_url}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.boardLink}
                aria-label={`${activeDept.name} 원본 게시판`}
              >
                <IconExternalLink size={13} />
                원본 게시판
              </a>
            )}
          </Group>
          {(() => {
            const newCount = activeDept
              ? (activeSummary?.newCount ?? 0)
              : aggregateSummary.newCount;
            const deadlineSoon = activeDept
              ? (activeSummary?.deadlineSoon ?? 0)
              : aggregateSummary.deadlineSoon;
            if (newCount === 0 && deadlineSoon === 0) {
              return (
                <Text size="sm" c="dimmed" className={classes.summaryEmpty}>
                  안 읽은 새 글이 없어요
                </Text>
              );
            }
            return (
              <Group gap="md" align="center" className={classes.summaryCounts}>
                {newCount > 0 && (
                  <Tooltip
                    label={`읽지 않은 새 공지 ${newCount}개`}
                    position="bottom"
                    withArrow
                  >
                    <span
                      className={classes.summaryCountNew}
                      aria-label={`새 글 ${newCount}개`}
                    >
                      <IconBellFilled size={14} />새 글 {newCount}
                    </span>
                  </Tooltip>
                )}
                {deadlineSoon > 0 && (
                  <Tooltip
                    label={`마감 ${DEADLINE_SOON_DAYS}일 이내 공지 ${deadlineSoon}개`}
                    position="bottom"
                    withArrow
                  >
                    <span
                      className={classes.summaryCountDeadline}
                      aria-label={`마감 임박 ${deadlineSoon}개 (${DEADLINE_SOON_DAYS}일 이내)`}
                    >
                      <IconCalendarEvent size={14} />
                      마감 임박 {deadlineSoon}
                    </span>
                  </Tooltip>
                )}
              </Group>
            );
          })()}
        </div>

        {/* Unified origin/source chip row — quieter, subordinate to tabs */}
        {activeDept && originChips.length > 1 && (
          <div className={classes.originScrollWrapper}>
            <div
              className={classes.originChips}
              role="group"
              aria-label="출처 필터"
            >
              {originChips.map((chip) => (
                <button
                  key={chip.key}
                  className={classes.originChip}
                  data-active={chip.active || undefined}
                  onClick={chip.onClick}
                  aria-pressed={chip.active}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className={classes.tabsFadeLeft} aria-hidden />
            <div className={classes.tabsFadeRight} aria-hidden />
          </div>
        )}
      </Stack>
    </div>
  );

  // Check if active single dept has no data
  if (activeDept && summaries.get(activeDept.code)?.hasData === false) {
    if (seg !== "college") {
      return (
        <div className={classes.pageContainer}>
          {header}
          <Center p={60} className={classes.emptyState}>
            <Stack align="center" gap="md">
              <IconSchool size={40} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">
                아직 수집된 글이 없습니다
              </Text>
              {activeDeptHasCollege && (
                <Button
                  variant="light"
                  color="skku-green"
                  size="sm"
                  onClick={() => handleSegChange("college")}
                >
                  소속 단과대 공지 보기
                </Button>
              )}
            </Stack>
          </Center>
        </div>
      );
    }
  }

  return (
    <NoticesClient
      scope={activeSegScope}
      header={header}
      originOf={originOf}
      statusScope={statusScope}
      hideAuthorFilter
      hidePinnedFilter
      hideZeroCategories
      compactQuickFilters
      hideDeadlineToggle
    />
  );
}
