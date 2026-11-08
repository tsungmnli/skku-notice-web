"use client";

import { useMemo } from "react";
import { Alert } from "@mantine/core";
import { IconClockExclamation } from "@tabler/icons-react";
import type { ArticleScope } from "@/lib/api/types";
import { useStatus } from "@/hooks/useStatus";
import { useDepartments } from "@/hooks/useDepartments";
import { parseSeoul, todayInSeoul } from "@/utils/date";

type Props = {
  scope?: ArticleScope;
};

function formatElapsed(lastCrawledAt: string): string {
  const last = parseSeoul(lastCrawledAt);
  const now = todayInSeoul();
  const minutes = now.diff(last, "minute");
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  const hours = now.diff(last, "hour");
  if (hours < 24) return `${hours}시간 전`;
  const days = now.diff(last, "day");
  return `${days}일 전`;
}

export function StatusBanner({ scope }: Props) {
  const status = useStatus();
  const { departments } = useDepartments();

  const delayedInfo = useMemo(() => {
    if (!status) return null;

    const slugs = new Set<string>(["skku"]);

    if (scope?.source) {
      for (const s of scope.source) slugs.add(s);
    }

    if (scope?.department) {
      for (const deptCode of scope.department) {
        const dept = departments.find((d) => d.code === deptCode);
        if (dept) {
          for (const src of dept.sources) {
            slugs.add(src.slug);
          }
        }
      }
    }

    const delayedSources = status.sources.filter(
      (s) => slugs.has(s.slug) && s.delayed,
    );

    if (delayedSources.length === 0) return null;

    let oldest: string | null = null;
    for (const s of delayedSources) {
      if (!s.last_crawled_at) continue;
      if (oldest === null || s.last_crawled_at < oldest) {
        oldest = s.last_crawled_at;
      }
    }

    const suffix = oldest ? ` 마지막 확인: ${formatElapsed(oldest)}` : "";
    return suffix;
  }, [status, scope, departments]);

  if (delayedInfo === null) return null;

  return (
    <Alert
      icon={<IconClockExclamation size={16} />}
      color="yellow"
      variant="light"
      radius="md"
    >
      {`공지 갱신이 늦어지고 있어요. 방금 올라온 글이 아직 안 보일 수 있습니다.${delayedInfo}`}
    </Alert>
  );
}
