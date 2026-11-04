"use client";

import { Group, Text, ActionIcon, Tooltip, Chip } from "@mantine/core";
import { IconStar, IconCheck } from "@tabler/icons-react";
import { CATEGORY_CODES, categoryLabel } from "@/utils/constants";
import { categoryColor } from "@/lib/calendar/categories";
import classes from "./FilterBar.module.css";

type Props = {
  favoritesOnly: boolean;
  hiddenCategories: string[];
  counts: Record<string, number>;
  favoritesCount: number;
  onToggleFavoritesOnly: () => void;
  onToggleCategory: (code: string) => void;
  onAllOn: () => void;
  onAllOff: () => void;
};

export function FilterBar({
  favoritesOnly,
  hiddenCategories,
  counts,
  favoritesCount,
  onToggleFavoritesOnly,
  onToggleCategory,
  onAllOn,
  onAllOff,
}: Props) {
  const allOff = hiddenCategories.length === CATEGORY_CODES.length;

  return (
    <Group gap="xs" wrap="wrap" align="center" className={classes.bar}>
      <Chip
        checked={favoritesOnly}
        onChange={onToggleFavoritesOnly}
        size="sm"
        variant="light"
        color="yellow"
        icon={<IconStar size={14} fill={favoritesOnly ? "currentColor" : "none"} />}
        className={classes.favChip}
      >
        ★ 즐겨찾기만{favoritesOnly ? ` (${favoritesCount})` : ""}
      </Chip>

      <Group gap={4} wrap="wrap" className={classes.catGroup}>
        {CATEGORY_CODES.map((code) => {
          const hidden = hiddenCategories.includes(code);
          const count = counts[code] ?? 0;
          return (
            <Chip
              key={code}
              checked={!hidden}
              onChange={() => onToggleCategory(code)}
              size="sm"
              variant="light"
              className={classes.catChip}
              styles={{
                root: { borderColor: hidden ? undefined : categoryColor(code) },
              }}
            >
              {categoryLabel(code)} ({count})
            </Chip>
          );
        })}
      </Group>

      <Group gap={4}>
        <Tooltip label="모두 켜기">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onAllOn}
            disabled={!allOff && hiddenCategories.length === 0}
            aria-label="모두 켜기"
          >
            <IconCheck size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="모두 끄기">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onAllOff}
            disabled={allOff}
            aria-label="모두 끄기"
          >
            <Text size="xs" c="dimmed">끄기</Text>
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
