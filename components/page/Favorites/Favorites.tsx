"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Stack,
  Text,
  Center,
  Button,
  Group,
  Alert,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconStar,
  IconStarOff,
  IconAlertCircle,
  IconCalendarPlus,
  IconTrash,
  IconInbox,
  IconArrowRight,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { ArticleCard } from "@/components/common/ArticleCard";
import { NoticeCardSkeleton } from "@/components/common/NoticeCardSkeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useFavoritesLookup } from "./hooks/useFavoritesLookup";
import { CalendarSubscribeModal } from "./modules/CalendarSubscribeModal";
import { SEOUL_TZ } from "@/utils/date";
import classes from "./Favorites.module.css";

export function FavoritesClient() {
  const { favorites, hydrated, isFavorite, toggleFavorite, removeFavorite } =
    useFavorites();
  const { data, loading, error, refetch } = useFavoritesLookup(
    favorites,
    hydrated,
  );
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const { found, missing, sortedFound } = useMemo(() => {
    if (!data) return { found: [], missing: [], sortedFound: [] };
    const sorted = [...data.items].sort((a, b) => {
      if (!a.deadline_at && !b.deadline_at) return 0;
      if (!a.deadline_at) return 1;
      if (!b.deadline_at) return -1;
      return (
        dayjs.tz(a.deadline_at, SEOUL_TZ).valueOf() -
        dayjs.tz(b.deadline_at, SEOUL_TZ).valueOf()
      );
    });
    return {
      found: data.items,
      missing: data.missing_ids,
      sortedFound: sorted,
    };
  }, [data]);

  const calendarUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
    const ids = favorites.slice(0, 100);
    if (ids.length === 0) return "";
    const params = ids.map((id) => `id=${id}`).join("&");
    return `${base}/calendar?${params}`;
  }, [favorites]);

  const handleSubscribe = () => {
    if (favorites.length === 0) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(calendarUrl).catch(() => {});
    }
    setSubscribeOpen(true);
  };

  const handleClearDeleted = () => {
    if (!data) return;
    for (const id of data.missing_ids) {
      removeFavorite(id);
    }
    notifications.show({
      message: "삭제된 공지를 즐겨찾기에서 제거했습니다.",
      color: "skku-green",
    });
  };

  const handleRemoveDeleted = (id: number) => {
    removeFavorite(id);
  };

  if (!hydrated) {
    return (
      <div className={classes.pageContainer}>
        <Stack>
          {Array.from({ length: 5 }).map((_, i) => (
            <NoticeCardSkeleton key={i} />
          ))}
        </Stack>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={classes.pageContainer}>
        <Center p={60} className={classes.emptyState}>
          <Stack align="center" gap="md">
            <IconStarOff size={48} color="var(--mantine-color-gray-4)" />
            <Stack gap={4} align="center">
              <Text fw={600} size="sm">
                즐겨찾기가 비어 있습니다
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                공지 목록에서 별표 아이콘을 눌러 즐겨찾기를 추가해 보세요
              </Text>
            </Stack>
            <Button
              component={Link}
              href="/"
              variant="light"
              color="skku-green"
              size="sm"
              rightSection={<IconArrowRight size={16} />}
            >
              공지사항 둘러보기
            </Button>
          </Stack>
        </Center>
      </div>
    );
  }

  return (
    <div className={classes.pageContainer}>
      <Stack gap="md">
        <Group
          justify="space-between"
          align="center"
          className={classes.header}
        >
          <Group gap={6} align="center">
            <IconStar
              size={20}
              color="var(--mantine-color-yellow-6)"
              fill="currentColor"
            />
            <Text fw={700} size="lg">
              즐겨찾기
            </Text>
            <Text size="sm" c="dimmed">
              ({found.length})
            </Text>
          </Group>
          <Button
            variant="light"
            color="skku-green"
            size="xs"
            leftSection={<IconCalendarPlus size={16} />}
            onClick={handleSubscribe}
            disabled={favorites.length === 0}
          >
            캘린더 구독
          </Button>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{error}</Text>
              <Button variant="white" size="xs" onClick={refetch}>
                다시 시도
              </Button>
            </Group>
          </Alert>
        )}

        {loading ? (
          <Stack gap={0}>
            {Array.from({ length: 6 }).map((_, i) => (
              <NoticeCardSkeleton key={i} />
            ))}
          </Stack>
        ) : sortedFound.length > 0 ? (
          <Box className={classes.list}>
            {sortedFound.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isFavorite={isFavorite(article.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </Box>
        ) : (
          !error && (
            <Center p={40}>
              <Stack align="center" gap="sm">
                <IconInbox size={40} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">
                  표시할 공지가 없습니다
                </Text>
              </Stack>
            </Center>
          )
        )}

        {missing.length > 0 && (
          <>
            <Divider
              label={
                <Group gap={4}>
                  <IconAlertCircle
                    size={14}
                    color="var(--mantine-color-gray-5)"
                  />
                  <Text size="xs" c="dimmed">
                    삭제된 공지 ({missing.length})
                  </Text>
                </Group>
              }
              labelPosition="center"
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                size="xs"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={handleClearDeleted}
              >
                삭제된 공지 모두 제거
              </Button>
            </Group>
            <Stack gap={0} className={classes.missingList}>
              {missing.map((id) => (
                <Group
                  key={id}
                  justify="space-between"
                  align="center"
                  className={classes.missingItem}
                >
                  <Group gap={8} align="center">
                    <IconAlertCircle
                      size={14}
                      color="var(--mantine-color-gray-5)"
                    />
                    <Text size="sm" c="dimmed" className={classes.missingText}>
                      공지 #{id} (삭제됨)
                    </Text>
                  </Group>
                  <Button
                    variant="subtle"
                    size="xs"
                    color="red"
                    onClick={() => handleRemoveDeleted(id)}
                    aria-label={`공지 ${id} 제거`}
                  >
                    제거
                  </Button>
                </Group>
              ))}
            </Stack>
          </>
        )}
      </Stack>

      <CalendarSubscribeModal
        opened={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        calendarUrl={calendarUrl}
      />
    </div>
  );
}
