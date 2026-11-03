"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { AuthLayout } from "@/components/page/Auth";
import { ApiError, api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import classes from "@/components/page/Auth/Auth.module.css";

export function ForgotPasswordClient() {
  const router = useRouter();
  const { status } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const startCooldown = (seconds: number | undefined) => {
    setCooldown(Math.max(1, seconds ?? 60));
  };

  const sendRequest = async () => {
    setError(null);
    setDetail(null);
    setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      setDetail(result.detail);
      startCooldown(60);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError(
        caught instanceof Error
          ? caught.message
          : "비밀번호 재설정 메일 요청 중 오류가 발생했습니다.",
      );
      if (apiError?.code === "rate_limited") {
        startCooldown(apiError.retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendRequest();
  };

  const handleResend = () => {
    void sendRequest();
  };

  if (status === "loading" || status === "authenticated") return null;

  if (detail) {
    return (
      <AuthLayout title="메일을 확인해 주세요">
        <Stack gap="md">
          <Alert color="skku-green" variant="light" role="status">
            {detail}
          </Alert>
          {error && (
            <Alert color="red" variant="light" role="alert">
              {error}
            </Alert>
          )}
          <Stack gap="xs">
            <Text size="xs" c="dimmed" className={classes.subtle}>
              재설정 링크는 1시간 동안 유효합니다.
            </Text>
            <Text size="xs" c="dimmed" className={classes.subtle}>
              비밀번호를 재설정하면 모든 기기에서 로그아웃됩니다.
            </Text>
            <Text size="xs" c="dimmed" className={classes.subtle}>
              Google로만 가입하신 경우에도 여기서 비밀번호를 만들 수 있습니다.
            </Text>
          </Stack>
          <Button
            type="button"
            variant="light"
            color="skku-green"
            onClick={handleResend}
            loading={loading}
            disabled={cooldown > 0}
            className={classes.fullButton}
          >
            {cooldown > 0
              ? `다시 보내기 (${cooldown}초)`
              : "다시 보내기"}
          </Button>
          <Text component={Link} href="/login" size="sm" className={classes.link}>
            로그인으로 돌아가기
          </Text>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="비밀번호 재설정"
      description="가입한 이메일을 입력하면 재설정 링크를 보내 드립니다."
    >
      <Stack gap="lg">
        {error && (
          <Alert color="red" variant="light" role="alert">
            {error}
          </Alert>
        )}
        <Stack gap="xs">
          <Text size="xs" c="dimmed" className={classes.subtle}>
            재설정 링크는 1시간 동안 유효합니다.
          </Text>
          <Text size="xs" c="dimmed" className={classes.subtle}>
            비밀번호를 재설정하면 모든 기기에서 로그아웃됩니다.
          </Text>
          <Text size="xs" c="dimmed" className={classes.subtle}>
            Google로만 가입하신 경우에도 여기서 비밀번호를 만들 수 있습니다.
          </Text>
        </Stack>
        <form onSubmit={handleSubmit} className={classes.form}>
          <Stack gap="md">
            <TextInput
              label="이메일"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              color="skku-green"
              loading={loading}
              disabled={cooldown > 0}
              className={classes.fullButton}
            >
              {cooldown > 0 ? `재설정 메일 보내기 (${cooldown}초)` : "재설정 메일 보내기"}
            </Button>
          </Stack>
        </form>
        <Text component={Link} href="/login" size="sm" className={classes.link}>
          로그인으로 돌아가기
        </Text>
      </Stack>
    </AuthLayout>
  );
}
