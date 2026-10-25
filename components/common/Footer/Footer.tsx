import { Text, Stack } from "@mantine/core";
import classes from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={classes.footer}>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed" fw={500}>
          성균관대학교 공지사항 aggregator
        </Text>
        <Text size="xs" c="dimmed" opacity={0.7}>
          본 서비스는 비공식 서비스이며, 모든 저작권은 성균관대학교에 있습니다.
        </Text>
      </Stack>
    </footer>
  );
}
