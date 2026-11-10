"use client";

import { SegmentedControl } from "@mantine/core";
import { IconBuilding } from "@tabler/icons-react";
import Link from "next/link";
import classes from "./ScopeSwitch.module.css";

export type ScopeFilter = "dept" | "all" | "campus";

type Props = {
  value: ScopeFilter;
  onChange: (value: ScopeFilter) => void;
  hasDepts: boolean;
  deptCount: number;
  campusCount: number;
};

export function ScopeSwitch({
  value,
  onChange,
  hasDepts,
  deptCount,
  campusCount,
}: Props) {
  // B2: when no departments selected, "모두" and "학교 공지" are identical
  // and "내 학과" is disabled. Show only the campus view + an inline link
  // to add departments.
  if (!hasDepts) {
    return (
      <div className={classes.noDeptWrapper}>
        <SegmentedControl
          value="campus"
          onChange={() => {}}
          data={[{ value: "campus", label: `학교 공지 · ${campusCount}` }]}
          size="sm"
          className={classes.control}
        />
        <Link href="/dept/edit" className={classes.addDeptLink}>
          <IconBuilding size={14} />
          <span>학과 추가</span>
        </Link>
      </div>
    );
  }

  const totalCount = deptCount + campusCount;

  const data: { value: ScopeFilter; label: string; disabled?: boolean }[] = [
    { value: "dept", label: `내 학과 · ${deptCount}` },
    { value: "all", label: `모두 · ${totalCount}` },
    { value: "campus", label: `학교 공지 · ${campusCount}` },
  ];

  return (
    <SegmentedControl
      value={value}
      onChange={(v) => onChange(v as ScopeFilter)}
      data={data}
      size="sm"
      className={classes.control}
    />
  );
}
