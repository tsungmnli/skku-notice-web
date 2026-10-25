"use client";

import {
  Stack,
  Text,
  Checkbox,
  MultiSelect,
  SegmentedControl,
  Switch,
  Button,
  Group,
  Divider,
  TextInput,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useState, useMemo } from "react";
import type { Category, PinnedFilter, Writer } from "@/lib/api/types";
import { PINNED_LABELS, categoryLabel } from "@/utils/constants";
import classes from "./FilterPanel.module.css";

type Props = {
  categories: Category[];
  writers: Writer[];
  selectedCategories: string[];
  selectedWriters: string[];
  dateFrom: string;
  dateTo: string;
  pinned: PinnedFilter;
  hasDeadline: boolean;
  onChange: (updates: Record<string, string | string[] | null>) => void;
  onReset: () => void;
};

export function FilterPanel({
  categories,
  writers,
  selectedCategories,
  selectedWriters,
  dateFrom,
  dateTo,
  pinned,
  hasDeadline,
  onChange,
  onReset,
}: Props) {
  const [writerSearch, setWriterSearch] = useState("");
  const writerOptions = useMemo(
    () =>
      writers.map((w) => ({
        value: w.writer,
        label: `${w.writer} (${w.count})`,
      })),
    [writers],
  );

  return (
    <Stack gap="md" className={classes.panel}>
      <Group justify="space-between" align="center">
        <Text fw={700} size="sm">
          필터
        </Text>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconX size={14} />}
          onClick={onReset}
        >
          초기화
        </Button>
      </Group>

      <Divider />

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" className={classes.sectionLabel}>
          카테고리
        </Text>
        <Checkbox.Group
          value={selectedCategories}
          onChange={(val) => onChange({ category: val.length ? val : null })}
        >
          <Stack gap={6}>
            {categories.map((cat) => (
              <Checkbox
                key={cat.code}
                value={cat.code}
                label={`${categoryLabel(cat.code)} (${cat.count})`}
                size="xs"
              />
            ))}
          </Stack>
        </Checkbox.Group>
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" className={classes.sectionLabel}>
          작성자
        </Text>
        <MultiSelect
          data={writerOptions}
          value={selectedWriters}
          onChange={(val) => onChange({ writer: val.length ? val : null })}
          searchable
          searchValue={writerSearch}
          onSearchChange={setWriterSearch}
          placeholder="작성자 검색"
          size="xs"
          clearable
          maxDropdownHeight={200}
        />
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" className={classes.sectionLabel}>
          게시일
        </Text>
        <Stack gap="xs">
          <TextInput
            type="date"
            size="xs"
            value={dateFrom}
            onChange={(e) => onChange({ date_from: e.target.value || null })}
            aria-label="게시일 시작"
            className={classes.dateInput}
          />
          <TextInput
            type="date"
            size="xs"
            value={dateTo}
            onChange={(e) => onChange({ date_to: e.target.value || null })}
            aria-label="게시일 끝"
            className={classes.dateInput}
          />
        </Stack>
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" className={classes.sectionLabel}>
          고정 여부
        </Text>
        <SegmentedControl
          size="xs"
          fullWidth
          value={pinned}
          onChange={(val) => onChange({ pinned: val })}
          data={[
            { value: "include", label: PINNED_LABELS.include },
            { value: "exclude", label: PINNED_LABELS.exclude },
            { value: "only", label: PINNED_LABELS.only },
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Switch
          label="마감일 있는 공지만"
          size="xs"
          checked={hasDeadline}
          onChange={(e) =>
            onChange({ has_deadline: e.currentTarget.checked ? "true" : null })
          }
        />
      </Stack>
    </Stack>
  );
}
