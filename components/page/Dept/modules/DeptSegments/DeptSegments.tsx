"use client";

import { useMemo } from "react";
import { SegmentedControl, Stack } from "@mantine/core";

type NewCounts = {
  dept: number;
  college: number;
  hasNext: boolean;
};

type Props = {
  seg: "all" | "dept" | "college";
  onSegChange: (seg: "all" | "dept" | "college") => void;
  counts: NewCounts | null;
  collegeScopeEmpty: boolean;
};

export function DeptSegments({ seg, onSegChange, counts }: Props) {
  const deptLabel = useMemo(() => {
    const n = counts?.dept ?? 0;
    return n > 0 ? `학과 ●${counts!.hasNext ? "50+" : n}` : "학과";
  }, [counts]);

  const collegeLabel = useMemo(() => {
    const n = counts?.college ?? 0;
    return n > 0 ? `대학 ●${counts!.hasNext ? "50+" : n}` : "대학";
  }, [counts]);

  return (
    <Stack gap="xs" w="100%">
      <SegmentedControl
        size="sm"
        fullWidth
        value={seg}
        onChange={(val) => onSegChange(val as "all" | "dept" | "college")}
        data={[
          { value: "all", label: "전체" },
          { value: "dept", label: deptLabel },
          { value: "college", label: collegeLabel },
        ]}
      />
    </Stack>
  );
}
