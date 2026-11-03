"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconTrash, IconLogout, IconUserCircle } from "@tabler/icons-react";
import { ApiError, api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { formatSeoulDate } from "@/utils/date";
import classes from "./Account.module.css";

export function AccountClient() {
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteCooldown, setDeleteCooldown] = useState(0);
  const [reauthRequired, setReauthRequired] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/account");
    }
  }, [router, status]);

  useEffect(() => {
    if (deleteCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setDeleteCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [deleteCooldown]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.deleteMe(
        user?.has_password ? deletePassword || undefined : undefined,
      );
      await signOut();
      setDeleteOpen(false);
      router.replace("/");
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      if (apiError?.code === "reauth_required") {
        setReauthRequired(true);
        return;
      }
      setDeleteError(
        caught instanceof Error
          ? caught.message
          : "계정 삭제 중 오류가 발생했습니다.",
      );
      if (apiError?.code === "rate_limited") {
        setDeleteCooldown(Math.max(1, apiError.retryAfter ?? 60));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === "loading" || status === "anonymous" || !user) return null;

  const createdAtSeoul = formatSeoulDate(user.created_at);

  return (
    <div className={classes.page}>
      <Stack gap="lg" maw={520} mx="auto">
        <Group gap="sm" align="center">
          <IconUserCircle size={28} />
          <Title order={1} size="h2">내 계정</Title>
        </Group>

        <Stack gap="xs" className={classes.infoCard}>
          <div className={classes.row}>
            <Text size="sm" c="dimmed" className={classes.label}>이메일</Text>
            <Text size="sm" className={classes.value}>{user.email}</Text>
          </div>
          {user.name && (
            <div className={classes.row}>
              <Text size="sm" c="dimmed" className={classes.label}>이름</Text>
              <Text size="sm" className={classes.value}>{user.name}</Text>
            </div>
          )}
          <div className={classes.row}>
            <Text size="sm" c="dimmed" className={classes.label}>이메일 인증</Text>
            {user.email_verified ? (
              <Badge color="skku-green" variant="light" size="sm">인증됨</Badge>
            ) : (
              <Badge color="orange" variant="light" size="sm">미인증</Badge>
            )}
          </div>
          <div className={classes.row}>
            <Text size="sm" c="dimmed" className={classes.label}>로그인 방식</Text>
            <Group gap="xs">
              {user.has_password && (
                <Badge color="gray" variant="light" size="sm">이메일/비밀번호</Badge>
              )}
              {user.google_linked && (
                <Badge color="blue" variant="light" size="sm">Google</Badge>
              )}
              {!user.has_password && !user.google_linked && (
                <Text size="sm" c="dimmed">알 수 없음</Text>
              )}
            </Group>
          </div>
          <div className={classes.row}>
            <Text size="sm" c="dimmed" className={classes.label}>가입일</Text>
            <Text size="sm" className={classes.value}>{createdAtSeoul}</Text>
          </div>
        </Stack>

        <Stack gap="sm">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconLogout size={18} />}
            onClick={handleLogout}
            fullWidth
          >
            로그아웃
          </Button>
          <Button
            variant="light"
            color="red"
            leftSection={<IconTrash size={18} />}
            onClick={() => setDeleteOpen(true)}
            fullWidth
          >
            계정 삭제
          </Button>
        </Stack>
      </Stack>

      <Modal
        opened={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
          setDeletePassword("");
          setReauthRequired(false);
        }}
        title="계정 삭제"
        centered
      >
        {reauthRequired ? (
          <Stack gap="md">
            <Alert color="orange" variant="light" role="alert">
              다시 로그인한 뒤 삭제해 주세요.
            </Alert>
            <Button
              component="a"
              href={api.googleLoginUrl("/account")}
              color="blue"
              fullWidth
            >
              Google로 다시 로그인
            </Button>
          </Stack>
        ) : (
          <Stack gap="md">
            <Alert color="red" variant="light" role="alert">
              서버의 계정 데이터가 삭제되며, 이 브라우저의 즐겨찾기는 삭제되지 않습니다.
            </Alert>
            {user.has_password && (
              <PasswordInput
                label="비밀번호"
                placeholder="비밀번호를 입력해 주세요"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.currentTarget.value)}
                required
                disabled={deleteLoading}
              />
            )}
            {deleteError && (
              <Alert color="red" variant="light" role="alert">
                {deleteError}
              </Alert>
            )}
            {deleteCooldown > 0 && (
              <Text size="xs" c="dimmed">
                잠시 후 다시 시도해 주세요. ({deleteCooldown}초)
              </Text>
            )}
            <Group justify="flex-end" gap="sm">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteError(null);
                  setDeletePassword("");
                }}
                disabled={deleteLoading}
              >
                취소
              </Button>
              <Button
                color="red"
                onClick={handleDelete}
                loading={deleteLoading}
                disabled={
                  (user.has_password && !deletePassword) ||
                  deleteCooldown > 0
                }
              >
                삭제
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
