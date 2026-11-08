"use client";

import { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { api } from "@/lib/api/client";
import type { Department, Source } from "@/lib/api/types";
import { useDeptSelection } from "@/hooks/useDeptSelection";
import { DEPT_REQUEST_URL } from "@/utils/constants";
import { todayInSeoul } from "@/utils/date";
import classes from "./DeptPicker.module.css";

type LastPostCache = Map<string, string | null>;
const lastPostCache: LastPostCache = new Map();

const SIX_MONTHS_DAYS = 183;

function useLastPostedOn() {
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchLastPosted = async (slug: string): Promise<string | null> => {
    if (lastPostCache.has(slug)) return lastPostCache.get(slug)!;
    try {
      const resp = await api.listArticles({
        source: [slug],
        size: 1,
        sort: "posted_desc",
      });
      const posted = resp.items.length > 0 ? resp.items[0].posted_on : null;
      lastPostCache.set(slug, posted);
      return posted;
    } catch {
      lastPostCache.set(slug, null);
      return null;
    }
  };

  return { fetchLastPosted, fetchedRef };
}

type SourceRowProps = {
  source: Source;
  dept: Department;
  selected: boolean;
  onToggle: () => void;
};

function SourceRow({ source, selected, onToggle }: SourceRowProps) {
  const [lastPosted, setLastPosted] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { fetchLastPosted, fetchedRef } = useLastPostedOn();

  useEffect(() => {
    if (!selected || fetchedRef.current.has(source.slug)) return;
    if (source.count === 0) return;
    fetchedRef.current.add(source.slug);
    void fetchLastPosted(source.slug).then((posted) => {
      setLastPosted(posted);
      setLoaded(true);
    });
  }, [selected, source.slug, source.count, fetchLastPosted, fetchedRef]);

  const fetching = selected && source.count > 0 && !loaded;
  const isOld =
    lastPosted !== null &&
    todayInSeoul().diff(
      todayInSeoul()
        .set("year", Number(lastPosted.slice(0, 4)))
        .set("month", Number(lastPosted.slice(5, 7)) - 1)
        .set("date", Number(lastPosted.slice(8, 10))),
      "day",
    ) > SIX_MONTHS_DAYS;

  return (
    <Group gap="xs" align="center" className={classes.sourceRow} wrap="nowrap">
      <Checkbox
        size="sm"
        checked={selected}
        onChange={onToggle}
        aria-label={source.name}
        color="skku-green"
      />
      <Stack gap={0} className={classes.sourceInfo}>
        <Text
          size="sm"
          fw={selected ? 600 : 500}
          className={classes.sourceName}
        >
          {source.name}
        </Text>
        {source.count === 0 ? (
          <Text size="xs" c="dimmed" className={classes.noPosts}>
            아직 수집된 글이 없습니다
          </Text>
        ) : selected && !fetching && lastPosted && isOld ? (
          <Text size="xs" c="dimmed" className={classes.lastPost}>
            마지막 글: {lastPosted}
          </Text>
        ) : null}
      </Stack>
    </Group>
  );
}

type DeptGroupProps = {
  collegeName: string;
  departments: Department[];
  selection: { departments: string[]; sources: string[] };
  onToggleDept: (code: string) => void;
  onToggleSource: (slug: string, deptCode: string) => void;
};

function DeptGroup({
  collegeName,
  departments,
  selection,
  onToggleDept,
  onToggleSource,
}: DeptGroupProps) {
  return (
    <Stack gap="sm" className={classes.collegeGroup}>
      <Text
        fw={700}
        size="sm"
        c="var(--text-secondary)"
        className={classes.collegeTitle}
      >
        {collegeName}
      </Text>
      {departments.map((dept) => {
        const deptSelected = selection.departments.includes(dept.code);
        const hasMultipleSources = dept.sources.length > 1;
        const hasCommon = dept.sources.some((s) => s.common);

        return (
          <Stack key={dept.code} gap="xs" className={classes.deptItem}>
            <Checkbox
              size="sm"
              label={dept.name}
              checked={deptSelected}
              onChange={() => onToggleDept(dept.code)}
              color="skku-green"
              fw={deptSelected ? 600 : 500}
            />
            {hasMultipleSources && (
              <Stack gap="xs" className={classes.sourcesList}>
                {hasCommon && (
                  <SourceRow
                    source={dept.sources.find((s) => s.common)!}
                    dept={dept}
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
                    <SourceRow
                      key={source.slug}
                      source={source}
                      dept={dept}
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
      })}
    </Stack>
  );
}

type DeptPickerProps = {
  opened: boolean;
  onClose: () => void;
  departments: Department[];
  colleges: Map<string, Department>;
  loading: boolean;
  error: string | null;
};

export function DeptPicker({
  departments,
  colleges,
  loading,
  error,
}: DeptPickerProps) {
  const { selection, toggleDepartment, toggleSource } = useDeptSelection();

  const deptOnly = departments.filter((d) => d.kind === "department");

  const grouped: Record<string, Department[]> = {};
  for (const dept of deptOnly) {
    const key = dept.college ?? "__other__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(dept);
  }

  const collegeKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "__other__") return 1;
    if (b === "__other__") return -1;
    return a.localeCompare(b);
  });

  return (
    <ScrollArea.Autosize mah="calc(100dvh - 120px)" type="scroll">
      <Stack gap="md" p="md">
        <Group justify="space-between" align="center">
          <Text fw={700} size="lg">
            학과 고르기
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          보고 싶은 학과를 선택해 주세요. 여러 학과를 고를 수 있습니다.
        </Text>

        {loading ? (
          <Text size="sm" c="dimmed">
            불러오는 중...
          </Text>
        ) : error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : (
          <Stack gap="lg">
            {collegeKeys.map((key) => {
              const collegeName =
                key === "__other__"
                  ? "기타"
                  : (colleges.get(key)?.name ?? "기타");
              return (
                <DeptGroup
                  key={key}
                  collegeName={collegeName}
                  departments={grouped[key]}
                  selection={selection}
                  onToggleDept={toggleDepartment}
                  onToggleSource={toggleSource}
                />
              );
            })}
          </Stack>
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
    </ScrollArea.Autosize>
  );
}
