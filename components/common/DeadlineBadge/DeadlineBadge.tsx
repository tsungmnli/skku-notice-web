"use client";

import { Badge } from "@mantine/core";
import { IconClock, IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { computeDDay } from "@/utils/date";
import classes from "./DeadlineBadge.module.css";

type Props = {
  deadlineAt: string | null;
  size?: "xs" | "sm" | "md";
};

export function DeadlineBadge({ deadlineAt, size = "sm" }: Props) {
  if (!deadlineAt) return null;
  const info = computeDDay(deadlineAt);
  if (!info) return null;

  let variant: "filled" | "light" | "default" = "light";
  let color = "gray";
  let Icon = IconClock;
  let label = info.label;

  if (info.passed) {
    color = "gray";
    variant = "light";
    Icon = IconCheck;
    label = "마감";
  } else if (info.days <= 3) {
    color = "red";
    variant = "filled";
    Icon = IconAlertTriangle;
  } else if (info.days <= 7) {
    color = "orange";
    variant = "filled";
    Icon = IconClock;
  } else if (info.days <= 14) {
    color = "orange";
    variant = "light";
    Icon = IconClock;
  }

  return (
    <Badge
      size={size}
      color={color}
      variant={variant}
      className={classes.badge}
      data-passed={info.passed || undefined}
      data-imminent={(info.days >= 0 && info.days <= 3) || undefined}
      radius="sm"
      leftSection={<Icon size={size === "xs" ? 10 : 12} />}
    >
      {label}
    </Badge>
  );
}
