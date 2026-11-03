"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { AuthLayout } from "@/components/page/Auth";
import { ApiError, api } from "@/lib/api/client";
import classes from "@/components/page/Auth/Auth.module.css";

type Screen = "form" | "success" | "invalid_token" | "missing";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token"), [searchParams]);
  const [token, setToken] = useState<string | null>(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>(
    initialToken ? "form" : "missing",
  );

  useEffect(() => {
    if (initialToken) router.replace("/reset-password");
  }, [initialToken, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDetail(null);
    if (!token) {
      setScreen("missing");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("비밀번호는 8~128자로 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.resetPassword(token, password);
      setDetail(result.detail);
      setToken(null);
      setScreen("success");
      setTimeout(() => router.replace("/login"), 2000);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      if (apiError?.code === "invalid_token") {
        setToken(null);
        setScreen("invalid_token");
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "비밀번호 재설정 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (screen === "missing") {
    return (
      <AuthLayout title="비밀번호 재설정">
        <Stack gap="md">
          <Text size="sm" c="dimmed" className={classes.subtle}>
            재설정 링크가 없습니다. 비밀번호 재설정을 다시 요청해 주세요.
          </Text>
          <Button
            component={Link}
            href="/forgot-password"
            color="skku-green"
            className={classes.fullButton}
          >
            비밀번호 재설정 요청하기
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  if (screen === "invalid_token") {
    return (
      <AuthLayout title="링크가 만료되었습니다">
        <Stack gap="md">
          <Alert color="red" variant="light" role="alert">
            링크가 만료되었거나 이미 사용되었습니다.
          </Alert>
          <Button
            component={Link}
            href="/forgot-password"
            color="skku-green"
            className={classes.fullButton}
          >
            비밀번호 재설정 다시 요청하기
          </Button>
          <Text
            component={Link}
            href="/login"
            size="sm"
            className={classes.link}
          >
            로그인으로 돌아가기
          </Text>
        </Stack>
      </AuthLayout>
    );
  }

  if (screen === "success") {
    return (
      <AuthLayout title="비밀번호가 변경되었습니다">
        <Stack gap="md">
          <Alert color="skku-green" variant="light" role="status">
            {detail}
          </Alert>
          <Text size="sm" c="dimmed" className={classes.subtle}>
            로그인 화면으로 이동합니다. 잠시만 기다려 주세요.
          </Text>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="새 비밀번호 설정">
      <Stack gap="lg">
        {error && (
          <Alert color="red" variant="light" role="alert">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className={classes.form}>
          <Stack gap="md">
            <PasswordInput
              label="새 비밀번호"
              description="8~128자로 입력해 주세요."
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              disabled={loading}
            />
            <PasswordInput
              label="비밀번호 확인"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.currentTarget.value)
              }
              required
              disabled={loading}
            />
            <Button
              type="submit"
              color="skku-green"
              loading={loading}
              className={classes.fullButton}
            >
              비밀번호 변경
            </Button>
          </Stack>
        </form>
        <Group justify="center">
          <Text
            component={Link}
            href="/login"
            size="sm"
            className={classes.link}
          >
            로그인으로 돌아가기
          </Text>
        </Group>
      </Stack>
    </AuthLayout>
  );
}
