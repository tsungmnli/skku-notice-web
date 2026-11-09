"use client";

import { SegmentedControl } from "@mantine/core";
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
  const totalCount = deptCount + campusCount;

  const data: { value: ScopeFilter; label: string; disabled?: boolean }[] = [
    {
      value: "dept",
      label: `내 학과${hasDepts ? ` · ${deptCount}` : ""}`,
      disabled: !hasDepts,
    },
    { value: "all", label: `모두 · ${totalCount}` },
    { value: "campus", label: `학교 전체 · ${campusCount}` },
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
