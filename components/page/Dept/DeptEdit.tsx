"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  Badge,
  Button,
  Center,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  ActionIcon,
  ScrollArea,
  Tooltip,
} from "@mantine/core";
import {
  IconSearch,
  IconX,
  IconArrowLeft,
  IconCheck,
  IconSchool,
} from "@tabler/icons-react";
import Link from "next/link";
import { useDepartments } from "@/hooks/useDepartments";
import { useDeptSelection } from "@/hooks/useDeptSelection";
import { hasSelection } from "@/lib/departments/selection";
import type { Department, Source } from "@/lib/api/types";
import { DEPT_REQUEST_URL } from "@/utils/constants";
import classes from "./DeptEdit.module.css";

const SUMMARY_COLLAPSE_THRESHOLD = 4;

export function DeptEditClient() {
  const { departments, colleges, loading, error } = useDepartments();
  const { selection, hydrated, toggleDepartment, toggleSource } =
    useDeptSelection();
  const [search, setSearch] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const hasSelected = hydrated && hasSelection(selection);

  const departmentsByCode = useMemo(
    () => new Map(departments.map((d) => [d.code, d])),
    [departments],
  );

  const deptOnly = useMemo(
    () => departments.filter((d) => d.kind === "department"),
    [departments],
  );

  // Group departments by college, preserving API order
  const grouped = useMemo(() => {
    const groups: { code: string; name: string; departments: Department[] }[] =
      [];
    const groupMap = new Map<
      string,
      { code: string; name: string; departments: Department[] }
    >();
    for (const dept of deptOnly) {
      const collegeCode = dept.college ?? "__other__";
      if (!groupMap.has(collegeCode)) {
        const collegeName =
          collegeCode === "__other__"
            ? "기타"
            : (colleges.get(collegeCode)?.name ?? "기타");
        const entry = { code: collegeCode, name: collegeName, departments: [] };
        groupMap.set(collegeCode, entry);
        groups.push(entry);
      }
      groupMap.get(collegeCode)!.departments.push(dept);
    }
    return groups;
  }, [deptOnly, colleges]);

  // Search filtering at department row level
  const searchTrimmed = search.trim().toLowerCase().replace(/\s+/g, "");
  const filteredGroups = useMemo(() => {
    if (!searchTrimmed) return grouped;
    return grouped
      .map((group) => ({
        ...group,
        departments: group.departments.filter((d) =>
          d.name.toLowerCase().replace(/\s+/g, "").includes(searchTrimmed),
        ),
      }))
      .filter((g) => g.departments.length > 0);
  }, [grouped, searchTrimmed]);

  // Build one summary item per department, preserving pick order
  const selectedSummary = useMemo(() => {
    type SummaryItem = {
      deptCode: string;
      deptName: string;
      collegeName: string;
      needsDisambiguation: boolean;
      selectedSources: Source[];
      isFullDept: boolean;
      removeDept: () => void;
      removeSource: (slug: string) => void;
    };
    const items: SummaryItem[] = [];
    const seen = new Set<string>();

    // First: departments selected via toggleDepartment (whole-dept selections)
    for (const code of selection.departments) {
      const dept = departmentsByCode.get(code);
      if (!dept) continue;
      seen.add(code);
      const collegeName = dept.college
        ? (colleges.get(dept.college)?.name ?? "")
        : "";
      items.push({
        deptCode: code,
        deptName: dept.name,
        collegeName,
        needsDisambiguation: false,
        selectedSources: [],
        isFullDept: true,
        removeDept: () => toggleDepartment(code),
        removeSource: (slug: string) => toggleSource(slug, code),
      });
    }

    // Then: departments that have source-level selections
    for (const slug of selection.sources) {
      const dept = departments.find((d) =>
        d.sources.some((s) => s.slug === slug),
      );
      if (!dept || seen.has(dept.code)) {
        if (dept) {
          // Add source to existing item
          const existing = items.find((i) => i.deptCode === dept.code);
          const source = dept.sources.find((s) => s.slug === slug);
          if (existing && source) existing.selectedSources.push(source);
        }
        continue;
      }
      seen.add(dept.code);
      const collegeName = dept.college
        ? (colleges.get(dept.college)?.name ?? "")
        : "";
      const source = dept.sources.find((s) => s.slug === slug);
      items.push({
        deptCode: dept.code,
        deptName: dept.name,
        collegeName,
        needsDisambiguation: false,
        selectedSources: source ? [source] : [],
        isFullDept: false,
        removeDept: () => {
          // Remove all sources for this dept
          for (const s of dept.sources) {
            if (selection.sources.includes(s.slug)) {
              toggleSource(s.slug, dept.code);
            }
          }
        },
        removeSource: (s: string) => toggleSource(s, dept.code),
      });
    }

    // Check for duplicate department names to decide disambiguation
    const nameCounts = new Map<string, number>();
    for (const item of items) {
      nameCounts.set(item.deptName, (nameCounts.get(item.deptName) ?? 0) + 1);
    }
    for (const item of items) {
      item.needsDisambiguation = (nameCounts.get(item.deptName) ?? 0) > 1;
    }

    return items;
  }, [
    selection,
    departments,
    departmentsByCode,
    colleges,
    toggleDepartment,
    toggleSource,
  ]);

  // Count selected per college
  const selectedInCollege = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of selectedSummary) {
      const dept = departmentsByCode.get(item.deptCode);
      if (dept?.college) {
        counts.set(dept.college, (counts.get(dept.college) ?? 0) + 1);
      }
    }
    return counts;
  }, [selectedSummary, departmentsByCode]);

  // Decide how many summary items to show
  const showAllSummary =
    summaryExpanded || selectedSummary.length <= SUMMARY_COLLAPSE_THRESHOLD;
  const visibleSummary = showAllSummary
    ? selectedSummary
    : selectedSummary.slice(0, SUMMARY_COLLAPSE_THRESHOLD);
  const hiddenCount = selectedSummary.length - visibleSummary.length;

  if (!hydrated) {
    return (
      <div className={classes.pageContainer}>
        <Text size="sm" c="dimmed">
          불러오는 중...
        </Text>
      </div>
    );
  }

  return (
    <div className={classes.pageContainer}>
      {/* Sticky header bar */}
      <div className={classes.stickyHeader}>
        <Group
          justify="space-between"
          align="center"
          className={classes.stickyInner}
        >
          <Group gap="xs" align="center">
            <Link href="/dept" aria-label="학과 공지로 돌아가기">
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Link>
            <Text fw={700} size="lg">
              학과 편집
            </Text>
            {hasSelected && (
              <Badge size="sm" variant="light" color="skku-green" radius="xl">
                {selectedSummary.length}
              </Badge>
            )}
          </Group>
          <Button
            component={Link}
            href="/dept"
            variant="filled"
            color="skku-green"
            size="sm"
            leftSection={<IconCheck size={16} />}
            disabled={!hasSelected}
          >
            완료{hasSelected ? ` (${selectedSummary.length})` : ""}
          </Button>
        </Group>

        {/* Compact selected summary — horizontal scroll */}
        {selectedSummary.length > 0 && (
          <div className={classes.summaryBar}>
            <ScrollArea type="never" offsetScrollbars={false}>
              <Group gap={6} className={classes.summaryChips} wrap="nowrap">
                {visibleSummary.map((item) => (
                  <SummaryChip key={item.deptCode} item={item} />
                ))}
                {hiddenCount > 0 && (
                  <button
                    className={classes.moreChip}
                    onClick={() => setSummaryExpanded(true)}
                    aria-label={`선택한 학과 ${hiddenCount}개 더 보기`}
                  >
                    +{hiddenCount} 더 보기
                  </button>
                )}
                {summaryExpanded &&
                  selectedSummary.length > SUMMARY_COLLAPSE_THRESHOLD && (
                    <button
                      className={classes.collapseChip}
                      onClick={() => setSummaryExpanded(false)}
                      aria-label="요약 접기"
                    >
                      접기
                    </button>
                  )}
              </Group>
            </ScrollArea>
          </div>
        )}
      </div>

      <Stack gap="md" className={classes.contentBody}>
        {!hasSelected && (
          <Text size="sm" c="dimmed" className={classes.welcomeHint}>
            보고 싶은 학과를 선택하면 해당 학과와 소속 단과대의 공지를 한 곳에서
            볼 수 있습니다. 여러 학과를 고를 수 있습니다.
          </Text>
        )}

        {/* Search */}
        <TextInput
          placeholder="학과 이름으로 검색"
          size="md"
          leftSection={<IconSearch size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="학과 검색"
          rightSection={
            search ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSearch("")}
                aria-label="검색어 지우기"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : undefined
          }
        />

        {/* Department list */}
        {loading ? (
          <Text size="sm" c="dimmed">
            불러오는 중...
          </Text>
        ) : error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : filteredGroups.length === 0 ? (
          <Center p={40}>
            <Stack align="center" gap="sm">
              <IconSchool size={36} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">
                검색 결과가 없습니다
              </Text>
            </Stack>
          </Center>
        ) : (
          <Accordion
            chevronPosition="right"
            variant="separated"
            multiple
            defaultValue={
              searchTrimmed ? filteredGroups.map((g) => g.code) : []
            }
            className={classes.accordion}
          >
            {filteredGroups.map((group) => {
              const selectedCount = selectedInCollege.get(group.code) ?? 0;
              return (
                <Accordion.Item key={group.code} value={group.code}>
                  <Accordion.Control>
                    <Group gap="xs" align="center">
                      <Text fw={600} size="sm">
                        {group.name}
                      </Text>
                      <Badge size="xs" variant="light" color="gray" radius="xl">
                        {group.departments.length}
                      </Badge>
                      {selectedCount > 0 && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="skku-green"
                          radius="xl"
                        >
                          {selectedCount} 선택
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs" className={classes.deptList}>
                      {group.departments.map((dept) => (
                        <DeptRow
                          key={dept.code}
                          dept={dept}
                          selection={selection}
                          onToggleDept={toggleDepartment}
                          onToggleSource={toggleSource}
                        />
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}

        {DEPT_REQUEST_URL && (
          <>
            <Divider />
            <a
              href={DEPT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.requestLink}
            >
              내 학과가 없어요
            </a>
          </>
        )}
      </Stack>
    </div>
  );
}

type SummaryItem = {
  deptCode: string;
  deptName: string;
  collegeName: string;
  needsDisambiguation: boolean;
  selectedSources: Source[];
  isFullDept: boolean;
  removeDept: () => void;
  removeSource: (slug: string) => void;
};

function SummaryChip({ item }: { item: SummaryItem }) {
  const nonCommonSources = item.selectedSources.filter((s) => !s.common);
  const hasSubSources = !item.isFullDept && item.selectedSources.length > 0;
  const sourceLabel = hasSubSources
    ? nonCommonSources.length > 0
      ? ` · 전공 ${nonCommonSources.length}`
      : ""
    : "";

  const tooltipContent =
    hasSubSources && nonCommonSources.length > 0
      ? nonCommonSources.map((s) => s.name).join(", ")
      : item.needsDisambiguation && item.collegeName
        ? item.collegeName
        : "";

  const chip = (
    <div className={classes.summaryChip}>
      <span className={classes.summaryChipLabel}>
        {item.deptName}
        {sourceLabel && (
          <span className={classes.summaryChipSub}>{sourceLabel}</span>
        )}
        {item.needsDisambiguation && item.collegeName && (
          <span className={classes.summaryChipDisambig}>
            {" · "}
            {item.collegeName}
          </span>
        )}
      </span>
      <button
        className={classes.summaryChipRemove}
        onClick={item.removeDept}
        aria-label={`${item.deptName} 제거`}
      >
        <IconX size={14} />
      </button>
    </div>
  );

  if (tooltipContent) {
    return (
      <Tooltip label={tooltipContent} position="bottom" withArrow>
        {chip}
      </Tooltip>
    );
  }
  return chip;
}

type DeptRowProps = {
  dept: Department;
  selection: { departments: string[]; sources: string[] };
  onToggleDept: (code: string) => void;
  onToggleSource: (slug: string, deptCode: string) => void;
};

function DeptRow({
  dept,
  selection,
  onToggleDept,
  onToggleSource,
}: DeptRowProps) {
  const deptSelected = selection.departments.includes(dept.code);
  const hasMultipleSources = dept.sources.length > 1;
  const hasCommon = dept.sources.some((s) => s.common);
  const deptHasData = dept.count > 0;

  // For departments with multiple sources, compute indeterminate state
  const selectedSourceCount = dept.sources.filter(
    (s) =>
      selection.sources.includes(s.slug) ||
      (deptSelected && !s.common ? false : deptSelected),
  ).length;
  const isIndeterminate =
    hasMultipleSources &&
    !deptSelected &&
    selectedSourceCount > 0 &&
    selectedSourceCount < dept.sources.length;

  return (
    <Stack gap="xs" className={classes.deptItem}>
      <Group gap="xs" align="center" wrap="nowrap">
        <Checkbox
          size="sm"
          label={dept.name}
          checked={deptSelected}
          indeterminate={isIndeterminate}
          onChange={() => onToggleDept(dept.code)}
          color="skku-green"
          fw={deptSelected ? 600 : 500}
          disabled={!deptHasData && !deptSelected}
        />
        {!deptHasData && !deptSelected && (
          <Text size="xs" c="dimmed" className={classes.noPosts}>
            아직 수집된 글이 없습니다
          </Text>
        )}
      </Group>
      {hasMultipleSources && (
        <Stack gap="xs" className={classes.sourcesList}>
          {hasCommon && (
            <SourceCheckbox
              source={dept.sources.find((s) => s.common)!}
              selected={
                deptSelected ||
                selection.sources.includes(
                  dept.sources.find((s) => s.common)!.slug,
                )
              }
              onToggle={() =>
                onToggleSource(
                  dept.sources.find((s) => s.common)!.slug,
                  dept.code,
                )
              }
            />
          )}
          {dept.sources
            .filter((s) => !s.common)
            .map((source) => (
              <SourceCheckbox
                key={source.slug}
                source={source}
                selected={
                  deptSelected || selection.sources.includes(source.slug)
                }
                onToggle={() => onToggleSource(source.slug, dept.code)}
              />
            ))}
        </Stack>
      )}
    </Stack>
  );
}

type SourceCheckboxProps = {
  source: Source;
  selected: boolean;
  onToggle: () => void;
};

function SourceCheckbox({ source, selected, onToggle }: SourceCheckboxProps) {
  return (
    <Group gap="xs" align="center" className={classes.sourceRow} wrap="nowrap">
      <Checkbox
        size="sm"
        checked={selected}
        onChange={onToggle}
        aria-label={source.name}
        color="skku-green"
        disabled={source.count === 0 && !selected}
      />
      <Stack gap={0} className={classes.sourceInfo}>
        <Text
          size="sm"
          fw={selected ? 600 : 500}
          className={classes.sourceName}
        >
          {source.name}
        </Text>
        {source.count === 0 && (
          <Text size="xs" c="dimmed" className={classes.noPosts}>
            아직 수집된 글이 없습니다
          </Text>
        )}
      </Stack>
    </Group>
  );
}
