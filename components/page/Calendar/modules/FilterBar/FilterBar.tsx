"use client";

import { Group, Button, Chip } from "@mantine/core";
import { IconStar } from "@tabler/icons-react";
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
  const noneHidden = hiddenCategories.length === 0;

  // Show categories with items, plus any hidden by user (keep reachable)
  const visibleCodes = CATEGORY_CODES.filter((code) => {
    const count = counts[code] ?? 0;
    const isHidden = hiddenCategories.includes(code);
    return count > 0 || isHidden;
  });

  const hiddenZeroCount = CATEGORY_CODES.length - visibleCodes.length;

  return (
    <div className={classes.bar}>
      <div className={classes.chipScroll}>
        <Group
          gap="xs"
          wrap="nowrap"
          align="center"
          className={classes.chipRow}
        >
          <Chip
            checked={favoritesOnly}
            onChange={onToggleFavoritesOnly}
            size="sm"
            variant="light"
            color="yellow"
            icon={
              <IconStar
                size={14}
                fill={favoritesOnly ? "currentColor" : "none"}
              />
            }
            className={classes.favChip}
          >
            ★ 즐겨찾기만{favoritesOnly ? ` (${favoritesCount})` : ""}
          </Chip>

          {visibleCodes.map((code) => {
            const hidden = hiddenCategories.includes(code);
            const count = counts[code] ?? 0;
            const hasZero = count === 0;
            return (
              <Chip
                key={code}
                checked={!hidden}
                onChange={() => onToggleCategory(code)}
                size="sm"
                variant="light"
                className={classes.catChip}
                styles={{
                  root: {
                    borderColor: hidden ? undefined : categoryColor(code),
                    opacity: hasZero ? 0.55 : 1,
                  },
                }}
              >
                {categoryLabel(code)} ({count})
              </Chip>
            );
          })}
        </Group>
        <div className={classes.scrollHint} aria-hidden="true" />
      </div>

      <Group gap="xs" align="center" className={classes.controlsRow}>
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          onClick={noneHidden ? onAllOff : onAllOn}
          className={classes.toggleAll}
        >
          {noneHidden ? "전체 해제" : "전체 선택"}
        </Button>
        {hiddenZeroCount > 0 && (
          <span className={classes.hiddenHint}>
            외 {hiddenZeroCount}개 (0건)
          </span>
        )}
      </Group>
    </div>
  );
}
