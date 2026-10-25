"use client";

import {
  Modal,
  Stack,
  Text,
  Code,
  Group,
  Button,
  List,
  Divider,
} from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import classes from "./CalendarSubscribeModal.module.css";

type Props = {
  opened: boolean;
  onClose: () => void;
  calendarUrl: string;
};

export function CalendarSubscribeModal({
  opened,
  onClose,
  calendarUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      notifications.show({
        message: "캘린더 구독 URL이 복사되었습니다.",
        color: "skku-green",
        icon: <IconCheck size={16} />,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notifications.show({
        message: "복사에 실패했습니다. URL을 직접 선택해서 복사해 주세요.",
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="캘린더 구독 방법"
      size="md"
      centered
    >
      <Stack gap="md">
        <Stack gap={4}>
          <Text size="sm" fw={600}>
            구독 URL
          </Text>
          <Code className={classes.urlCode} block>
            {calendarUrl}
          </Code>
          <Button
            variant="light"
            color="skku-green"
            size="xs"
            leftSection={
              copied ? <IconCheck size={14} /> : <IconCopy size={14} />
            }
            onClick={handleCopy}
            className={classes.copyBtn}
          >
            {copied ? "복사됨" : "URL 복사"}
          </Button>
        </Stack>

        <Divider />

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            Google Calendar
          </Text>
          <List size="xs" spacing={4} className={classes.list}>
            <List.Item>
              Google Calendar를 열고 왼쪽 &ldquo;다른 캘린더&quot; 옆의
              &ldquo;+&quot; 클릭
            </List.Item>
            <List.Item>&ldquo;URL로 추가&quot; 선택</List.Item>
            <List.Item>
              위 URL을 붙여넣고 &ldquo;캘린더 추가&quot; 클릭
            </List.Item>
          </List>
        </Stack>

        <Divider />

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            Apple Calendar (iPhone / Mac)
          </Text>
          <List size="xs" spacing={4} className={classes.list}>
            <List.Item>
              설정 &rarr; 캘린더 &rarr; 계정 &rarr; 계정 추가
            </List.Item>
            <List.Item>
              &ldquo;CalDAV 계정 추가&quot; 선택 후 URL 입력
            </List.Item>
            <List.Item>
              또는 Mac의 캘린더 앱에서 &ldquo;캘린더 구독&quot; 후 URL 붙여넣기
            </List.Item>
          </List>
        </Stack>
      </Stack>
    </Modal>
  );
}
