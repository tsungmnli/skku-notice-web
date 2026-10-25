"use client";

import { ActionIcon, Badge, Group, Text } from "@mantine/core";
import {
  IconPin,
  IconStar,
  IconEye,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";
import type { Article } from "@/lib/api/types";
import { formatPostedOn, formatDeadline } from "@/utils/date";
import { categoryLabel } from "@/utils/constants";
import { DeadlineBadge } from "../DeadlineBadge";
import classes from "./ArticleCard.module.css";

type Props = {
  article: Article;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  faded?: boolean;
  showRemove?: boolean;
  onRemove?: (id: number) => void;
};

export function ArticleCard({
  article,
  isFavorite,
  onToggleFavorite,
  faded,
  showRemove,
  onRemove,
}: Props) {
  return (
    <article
      className={classes.card}
      data-faded={faded || undefined}
      data-pinned={article.is_pinned || undefined}
    >
      <Group gap={4} align="center" className={classes.actions}>
        <ActionIcon
          variant="subtle"
          color={isFavorite ? "yellow" : "gray"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(article.id);
          }}
          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          aria-pressed={isFavorite}
          className={classes.starBtn}
        >
          <IconStar size={18} fill={isFavorite ? "currentColor" : "none"} />
        </ActionIcon>
        {showRemove && onRemove && (
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(article.id);
            }}
            aria-label="목록에서 제거"
            className={classes.removeBtn}
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Group>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={classes.titleLink}
        aria-label={`${article.title} (새 탭에서 열기)`}
      >
        <div className={classes.content}>
          <div className={classes.titleRow}>
            {article.is_pinned && (
              <IconPin
                size={15}
                className={classes.pinIcon}
                aria-label="고정 공지"
              />
            )}
            <Text size="sm" fw={600} className={classes.title} lineClamp={2}>
              {article.title}
            </Text>
            <IconExternalLink size={14} className={classes.externalIcon} />
          </div>

          {(article.deadline_at || article.categories.length > 0) && (
            <div className={classes.infoRow}>
              {article.deadline_at && (
                <Group
                  gap={8}
                  align="center"
                  wrap="nowrap"
                  className={classes.deadlineGroup}
                >
                  <DeadlineBadge deadlineAt={article.deadline_at} size="sm" />
                  <Text size="xs" c="dimmed" className={classes.deadlineDate}>
                    {formatDeadline(article.deadline_at)}
                  </Text>
                </Group>
              )}
              {article.categories.length > 0 && (
                <Group gap={4} wrap="nowrap" className={classes.categories}>
                  {article.categories.slice(0, 3).map((code) => (
                    <Badge
                      key={code}
                      size="xs"
                      variant="light"
                      color="gray"
                      radius="sm"
                      className={classes.catBadge}
                    >
                      {categoryLabel(code)}
                    </Badge>
                  ))}
                </Group>
              )}
            </div>
          )}

          <Group gap="xs" align="center" wrap="nowrap" className={classes.meta}>
            <Text size="xs" c="dimmed" className={classes.writer}>
              {article.writer}
            </Text>
            <Text size="xs" c="dimmed" className={classes.dot}>
              ·
            </Text>
            <Text size="xs" c="dimmed" className={classes.date}>
              {formatPostedOn(article.posted_on)}
            </Text>
            {article.view_count !== null && (
              <>
                <Text size="xs" c="dimmed" className={classes.dot}>
                  ·
                </Text>
                <Group gap={3} align="center" wrap="nowrap">
                  <IconEye size={12} />
                  <Text size="xs" c="dimmed" className={classes.views}>
                    {article.view_count.toLocaleString()}
                  </Text>
                </Group>
              </>
            )}
          </Group>
        </div>
      </a>
    </article>
  );
}
