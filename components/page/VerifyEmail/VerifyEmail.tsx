"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { AuthLayout } from "@/components/page/Auth";
import { ApiError, api } from "@/lib/api/client";
import classes from "@/components/page/Auth/Auth.module.css";

type VerificationStatus = "loading" | "success" | "error" | "missing";

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const requestStartedRef = useRef(false);
  const [status, setStatus] = useState<VerificationStatus>(
    token ? "loading" : "missing",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!token || requestStartedRef.current) return;
    requestStartedRef.current = true;
    router.replace("/verify-email");

    // The token is one-use. The ref prevents React StrictMode from posting it twice.
    (async () => {
      try {
        const result = await api.verifyEmail(token);
        setMessage(result.detail);
        setStatus("success");
      } catch (caught) {
        const apiError = caught instanceof ApiError ? caught : null;
        setMessage(
          apiError?.code === "invalid_token"
            ? "링크가 만료되었거나 이미 사용되었습니다."
            : caught instanceof Error
              ? caught.message
              : "이메일 인증에 실패했습니다.",
        );
        setStatus("error");
        if (apiError?.code === "rate_limited") {
          setCooldown(Math.max(1, apiError.retryAfter ?? 60));
        }
      }
    })();
  }, [router, token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const result = await api.resendVerification(email);
      setResendMessage(result.detail);
      setCooldown(60);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setResendMessage(
        caught instanceof Error
          ? caught.message
          : "인증 메일을 다시 보내지 못했습니다.",
      );
      if (apiError?.code === "rate_limited") {
        setCooldown(Math.max(1, apiError.retryAfter ?? 60));
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthLayout title="이메일을 확인하는 중입니다">
        <Text size="sm" c="dimmed">
          잠시만 기다려 주세요.
        </Text>
      </AuthLayout>
    );
  }

  if (status === "missing") {
    return (
      <AuthLayout title="이메일 인증">
        <Stack gap="md">
          <Text size="sm" c="dimmed" className={classes.subtle}>
            이메일 인증 링크가 없습니다. 로그인 화면에서 다시 시작해 주세요.
          </Text>
          <Button
            component={Link}
            href="/login"
            color="skku-green"
            className={classes.fullButton}
          >
            로그인하러 가기
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout title="이메일이 인증되었습니다">
        <Stack gap="md">
          <Alert color="skku-green" variant="light" role="status">
            {message}
          </Alert>
          <Text size="sm" c="dimmed" className={classes.subtle}>
            인증이 완료되었습니다. 새로 로그인해 주세요.
          </Text>
          <Button
            component={Link}
            href="/login"
            color="skku-green"
            className={classes.fullButton}
          >
            로그인하러 가기
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="이메일 인증이 필요합니다">
      <Stack gap="lg">
        <Alert color="red" variant="light" role="alert">
          {message}
        </Alert>
        {cooldown > 0 && (
          <Text size="xs" c="dimmed">
            잠시 후 다시 시도해 주세요. ({cooldown}초)
          </Text>
        )}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            인증 메일 다시 받기
          </Text>
          <Text size="xs" c="dimmed" className={classes.subtle}>
            이메일을 입력하면 인증 메일을 다시 요청할 수 있습니다.
          </Text>
        </Stack>
        <form onSubmit={handleResend} className={classes.form}>
          <Stack gap="md">
            <TextInput
              label="이메일"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              disabled={resendLoading || cooldown > 0}
            />
            <Button
              type="submit"
              color="skku-green"
              loading={resendLoading}
              disabled={cooldown > 0}
              className={classes.fullButton}
            >
              {cooldown > 0
                ? `인증 메일 다시 보내기 (${cooldown}초)`
                : "인증 메일 다시 보내기"}
            </Button>
          </Stack>
        </form>
        {resendMessage && (
          <Alert color="skku-green" variant="light" role="status">
            {resendMessage}
          </Alert>
        )}
        <Text component={Link} href="/login" size="sm" className={classes.link}>
          로그인으로 돌아가기
        </Text>
      </Stack>
    </AuthLayout>
  );
}
