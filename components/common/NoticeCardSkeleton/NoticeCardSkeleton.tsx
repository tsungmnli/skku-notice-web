"use client";

import { Stack, Skeleton, Group } from "@mantine/core";
import classes from "./NoticeCardSkeleton.module.css";

export function NoticeCardSkeleton() {
  return (
    <div className={classes.skeleton}>
      <Group justify="space-between" align="center" mb={4}>
        <Skeleton height={16} width={40} radius="sm" />
        <Skeleton circle height={20} width={20} />
      </Group>
      <Stack gap={4}>
        <Skeleton height={15} width="92%" />
        <Skeleton height={15} width="68%" />
        <Group gap={8} mt={4}>
          <Skeleton height={18} width={48} radius="sm" />
          <Skeleton height={12} width={120} />
        </Group>
        <Group gap={4} mt={2}>
          <Skeleton height={14} width={50} radius="sm" />
          <Skeleton height={14} width={50} radius="sm" />
        </Group>
        <Group gap={8} mt={2}>
          <Skeleton height={11} width={90} />
          <Skeleton height={11} width={80} />
          <Skeleton height={11} width={60} />
        </Group>
      </Stack>
    </div>
  );
}
