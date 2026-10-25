"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Stack,
  TextInput,
  Group,
  Text,
  Pagination,
  Drawer,
  Button,
  Box,
  Center,
  Alert,
  ActionIcon,
  Badge,
  Select,
  ScrollArea,
  Divider,
} from "@mantine/core";
import {
  IconSearch,
  IconAdjustments,
  IconAlertCircle,
  IconInbox,
  IconX,
  IconArrowDown,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { ArticleCard } from "@/components/common/ArticleCard";
import { NoticeCardSkeleton } from "@/components/common/NoticeCardSkeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useNotices } from "./hooks/useNotices";
import { useFilterOptions } from "./hooks/useFilterOptions";
import { useNoticeQuery } from "./hooks/useNoticeQuery";
import { FilterPanel } from "./modules/FilterPanel";
import { SORT_LABELS, categoryLabel } from "@/utils/constants";
import type { SortKey } from "@/lib/api/types";
import classes from "./Notices.module.css";

const DEFAULT_SORT = "posted_desc";
const DEFAULT_PINNED = "include";

const SORT_OPTIONS = Object.entries(SORT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function NoticesContent() {
  const { query, updateQuery } = useNoticeQuery();
  const { categories, writers } = useFilterOptions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data, loading, error, refetch } = useNotices(query);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSearchInput, setActiveSearchInput] = useState(query.q || "");
  const [debounced] = useDebouncedValue(activeSearchInput, 300);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced === (query.q || "")) return;
    updateQuery({ q: debounced || null, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setActiveSearchInput(query.q || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q]);

  const selectedCategories = query.category || [];
  const selectedWriters = query.writer || [];
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length) count++;
    if (selectedWriters.length) count++;
    if (query.date_from || query.date_to) count++;
    if (query.pinned && query.pinned !== DEFAULT_PINNED) count++;
    if (query.has_deadline) count++;
    return count;
  }, [selectedCategories, selectedWriters, query]);

  const handleFilterChange = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      updateQuery({ ...updates, page: null });
    },
    [updateQuery],
  );

  const handleSortChange = useCallback(
    (val: string | null) => {
      const sort = (val || DEFAULT_SORT) as SortKey;
      updateQuery({ sort: sort !== DEFAULT_SORT ? sort : null, page: null });
    },
    [updateQuery],
  );

  const handleReset = useCallback(() => {
    updateQuery({
      category: null,
      writer: null,
      date_from: null,
      date_to: null,
      pinned: DEFAULT_PINNED,
      has_deadline: null,
      sort: DEFAULT_SORT,
      page: null,
    });
  }, [updateQuery]);

  const removeCategory = (code: string) => {
    updateQuery({
      category: selectedCategories.filter((c) => c !== code),
      page: null,
    });
  };
  const removeWriter = (w: string) => {
    updateQuery({
      writer: selectedWriters.filter((x) => x !== w),
      page: null,
    });
  };

  const handlePageChange = useCallback(
    (page: number) => {
      updateQuery({ page: page > 1 ? String(page) : null });
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateQuery],
  );

  const filterPanel = (
    <FilterPanel
      categories={categories}
      writers={writers}
      selectedCategories={selectedCategories}
      selectedWriters={selectedWriters}
      dateFrom={query.date_from || ""}
      dateTo={query.date_to || ""}
      pinned={query.pinned || DEFAULT_PINNED}
      hasDeadline={query.has_deadline || false}
      onChange={handleFilterChange}
      onReset={handleReset}
    />
  );

  return (
    <div className={classes.pageContainer}>
      <div className={classes.layout}>
        {/* Desktop sidebar */}
        <aside className={classes.sidebar}>
          <div ref={sidebarRef} className={classes.sidebarInner}>
            {filterPanel}
          </div>
        </aside>

        {/* Main list */}
        <div className={classes.main}>
          <Stack gap={0}>
            {/* Search + mobile filter button */}
            <div className={classes.searchRow}>
              <TextInput
                placeholder="제목, 작성자, 카테고리 검색"
                size="md"
                leftSection={<IconSearch size={18} />}
                value={activeSearchInput}
                onChange={(e) => setActiveSearchInput(e.target.value)}
                aria-label="공지사항 검색"
                className={classes.searchInput}
                rightSection={
                  activeSearchInput ? (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setActiveSearchInput("")}
                      aria-label="검색어 지우기"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  ) : undefined
                }
              />
              <Button
                variant="light"
                color="skku-green"
                onClick={() => setDrawerOpen(true)}
                className={classes.filterBtn}
                leftSection={<IconAdjustments size={16} />}
                aria-label="필터 열기"
              >
                필터
                {activeFilterCount > 0 && (
                  <Badge
                    size="xs"
                    color="skku-green"
                    variant="filled"
                    ml={4}
                    className={classes.filterBadge}
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Removable filter chips */}
            {(selectedCategories.length > 0 || selectedWriters.length > 0) && (
              <Group gap={6} className={classes.chips}>
                {selectedCategories.map((c) => (
                  <Badge
                    key={c}
                    size="sm"
                    variant="light"
                    color="skku-green"
                    radius="sm"
                    rightSection={
                      <button
                        className={classes.chipRemove}
                        onClick={() => removeCategory(c)}
                        aria-label={`${categoryLabel(c)} 필터 제거`}
                      >
                        <IconX size={10} />
                      </button>
                    }
                  >
                    {categoryLabel(c)}
                  </Badge>
                ))}
                {selectedWriters.map((w) => (
                  <Badge
                    key={w}
                    size="sm"
                    variant="light"
                    color="gray"
                    radius="sm"
                    rightSection={
                      <button
                        className={classes.chipRemove}
                        onClick={() => removeWriter(w)}
                        aria-label={`${w} 필터 제거`}
                      >
                        <IconX size={10} />
                      </button>
                    }
                  >
                    {w}
                  </Badge>
                ))}
              </Group>
            )}

            {/* Result header: count + sort dropdown */}
            <div className={classes.resultHeader}>
              <Text size="sm" c="dimmed" fw={500}>
                {loading
                  ? "불러오는 중..."
                  : `${(data?.total ?? 0).toLocaleString()}개의 공지`}
              </Text>
              <Select
                size="xs"
                data={SORT_OPTIONS}
                value={query.sort || DEFAULT_SORT}
                onChange={handleSortChange}
                aria-label="정렬 순서"
                rightSection={<IconArrowDown size={14} />}
                className={classes.sortSelect}
              />
            </div>

            {/* Content */}
            {error ? (
              <Center p={40}>
                <Stack align="center" gap="md">
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    variant="light"
                  >
                    {error}
                  </Alert>
                  <Button variant="light" color="skku-green" onClick={refetch}>
                    다시 시도
                  </Button>
                </Stack>
              </Center>
            ) : loading && !data ? (
              <div className={classes.list}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <NoticeCardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <div className={classes.list}>
                {data.items.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isFavorite={isFavorite(article.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <Center p={60} className={classes.emptyState}>
                <Stack align="center" gap="md">
                  <IconInbox size={48} color="var(--mantine-color-gray-4)" />
                  <Stack gap={4} align="center">
                    <Text fw={600} size="sm">
                      조건에 맞는 공지가 없습니다
                    </Text>
                    <Text size="xs" c="dimmed">
                      필터를 변경하거나 검색어를 다시 입력해 보세요
                    </Text>
                  </Stack>
                  {activeFilterCount > 0 && (
                    <Button variant="subtle" size="xs" onClick={handleReset}>
                      필터 초기화
                    </Button>
                  )}
                </Stack>
              </Center>
            )}

            {/* Pagination */}
            {data && data.total > (query.size || 20) && (
              <Center p="md">
                <Pagination
                  value={query.page || 1}
                  onChange={handlePageChange}
                  total={Math.ceil(data.total / (query.size || 20))}
                  color="skku-green"
                  size="sm"
                  siblings={1}
                />
              </Center>
            )}
          </Stack>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="필터"
        padding="md"
        size="340px"
        position="right"
      >
        <ScrollArea.Autosize mah="calc(100dvh - 120px)">
          {filterPanel}
        </ScrollArea.Autosize>
      </Drawer>
    </div>
  );
}

export function NoticesClient() {
  return (
    <Suspense
      fallback={
        <Center p={40}>
          <NoticeCardSkeleton />
        </Center>
      }
    >
      <NoticesContent />
    </Suspense>
  );
}
