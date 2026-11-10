"use client";

import type { CSSProperties } from "react";
import { IconStar } from "@tabler/icons-react";
import { CATEGORY_CODES, categoryLabel } from "@/utils/constants";
import { categoryColor } from "@/lib/calendar/categories";
import classes from "./FilterBar.module.css";

type Props = {
  favoritesOnly: boolean;
  /** 저장 형식은 그대로(숨긴 카테고리 목록). 비어 있으면 "전체". */
  hiddenCategories: string[];
  counts: Record<string, number>;
  totalCount: number;
  favoritesCount: number;
  onToggleFavoritesOnly: () => void;
  onToggleCategory: (code: string) => void;
  onClearCategories: () => void;
};

export function FilterBar({
  favoritesOnly,
  hiddenCategories,
  counts,
  totalCount,
  favoritesCount,
  onToggleFavoritesOnly,
  onToggleCategory,
  onClearCategories,
}: Props) {
  // 아무것도 고르지 않은 상태 = 전체. 이때는 어떤 칩도 켜져 있지 않다.
  const allSelected = hiddenCategories.length === 0;

  // 이 기간에 공지가 있는 카테고리만 보여준다 (0건 칩은 숨김).
  const codes = CATEGORY_CODES.filter((code) => (counts[code] ?? 0) > 0);

  const favDisabled = !favoritesOnly && favoritesCount === 0;

  return (
    <div className={classes.bar}>
      <div className={classes.chipScroll}>
        <div
          className={classes.chipRow}
          role="group"
          aria-label="카테고리 필터"
        >
          <button
            type="button"
            className={classes.chip}
            data-active={allSelected || undefined}
            aria-pressed={allSelected}
            onClick={onClearCategories}
          >
            전체 <span className={classes.count}>{totalCount}</span>
          </button>

          {codes.map((code) => {
            const active = !allSelected && !hiddenCategories.includes(code);
            return (
              <button
                key={code}
                type="button"
                className={classes.chip}
                data-active={active || undefined}
                aria-pressed={active}
                onClick={() => onToggleCategory(code)}
                style={{ "--chip-color": categoryColor(code) } as CSSProperties}
              >
                <span className={classes.dot} aria-hidden="true" />
                {categoryLabel(code)}{" "}
                <span className={classes.count}>{counts[code]}</span>
              </button>
            );
          })}
        </div>
        <div className={classes.scrollHint} aria-hidden="true" />
      </div>

      {/* 카테고리와는 성격이 다른 필터라 구분선 + 다른 모양으로 분리 */}
      <span className={classes.divider} aria-hidden="true" />
      <button
        type="button"
        className={classes.fav}
        data-active={favoritesOnly || undefined}
        aria-pressed={favoritesOnly}
        disabled={favDisabled}
        onClick={onToggleFavoritesOnly}
      >
        <IconStar size={14} fill={favoritesOnly ? "currentColor" : "none"} />
        즐겨찾기 <span className={classes.count}>{favoritesCount}</span>
      </button>
    </div>
  );
}
