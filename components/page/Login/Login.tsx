"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconArrowRight, IconMailForward } from "@tabler/icons-react";
import { AuthLayout, GoogleButton } from "@/components/page/Auth";
import { ApiError, api } from "@/lib/api/client";
import { isMockMode } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/safeNext";
import { useAuth } from "@/hooks/useAuth";
import classes from "@/components/page/Auth/Auth.module.css";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_failed: "Google 로그인에 실패했습니다. 다시 시도해 주세요.",
  google_unverified:
    "Google이 이메일 인증을 확인해 주지 않아 로그인할 수 없습니다.",
  google_conflict: "이 이메일은 이미 다른 Google 계정과 연결되어 있습니다.",
  google_disabled:
    "지금은 Google 로그인을 사용할 수 없습니다. 이메일로 로그인해 주세요.",
};

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, signIn } = useAuth();
  const nextPath = safeNext(searchParams.get("next"));
  // Google 이 /login?error=<코드> 로 돌려보낸다. 아래 effect 가 URL 에서 error 를 지우므로
  // 처음 값을 state 로 붙잡아 두지 않으면 안내 문구가 곧바로 사라진다.
  const [googleError] = useState(() => searchParams.get("error"));
  const mockGoogle = searchParams.get("mock_google");
  const googleErrorMessage = googleError
    ? GOOGLE_ERROR_MESSAGES[googleError] ||
      "로그인에 실패했습니다. 다시 시도해 주세요."
    : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // mock 전용 자동 로그인. real 모드에서는 ?mock_google 이 들어와도 무시한다.
  const mockGoogleActive = isMockMode && !!mockGoogle;

  useEffect(() => {
    if (!mockGoogleActive || status !== "anonymous") return;
    void (async () => {
      try {
        const result = await api.googleLogin();
        signIn(result.user);
        router.replace(nextPath);
      } catch {
        router.replace("/login");
      }
    })();
  }, [mockGoogleActive, nextPath, router, signIn, status]);

  useEffect(() => {
    if (status === "authenticated") router.replace(nextPath);
  }, [nextPath, router, status]);

  useEffect(() => {
    if (!searchParams.get("error")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  }, [router, searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const startCooldown = (seconds: number | undefined) => {
    setCooldown(Math.max(1, seconds ?? 60));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResendMessage(null);
    setEmailNotVerified(false);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      signIn(result.user);
      router.replace(nextPath);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError(
        caught instanceof Error
          ? caught.message
          : "로그인 중 오류가 발생했습니다.",
      );
      setEmailNotVerified(apiError?.code === "email_not_verified");
      if (apiError?.code === "rate_limited") {
        startCooldown(apiError.retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const result = await api.resendVerification(email);
      setResendMessage(result.detail);
      startCooldown(60);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setResendMessage(
        caught instanceof Error
          ? caught.message
          : "인증 메일을 다시 보내지 못했습니다.",
      );
      if (apiError?.code === "rate_limited") {
        startCooldown(apiError.retryAfter);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.assign(api.googleLoginUrl(nextPath));
  };

  if (status === "loading" || status === "authenticated") return null;

  return (
    <AuthLayout
      title="로그인"
      description="SKKU 공지사항을 편리하게 이용해 보세요."
    >
      <Stack gap="lg">
        {(googleErrorMessage || error || resendMessage) && (
          <Stack gap="xs">
            {googleErrorMessage && (
              <Alert color="red" variant="light" role="alert">
                {googleErrorMessage}
              </Alert>
            )}
            {error && (
              <Alert color="red" variant="light" role="alert">
                {error}
              </Alert>
            )}
            {resendMessage && (
              <Alert color="skku-green" variant="light" role="status">
                {resendMessage}
              </Alert>
            )}
          </Stack>
        )}

        <form onSubmit={handleSubmit} className={classes.form}>
          <Stack gap="md">
            <TextInput
              label="이메일"
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              disabled={loading || resendLoading}
            />
            <PasswordInput
              label="비밀번호"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              disabled={loading || resendLoading}
            />
            {emailNotVerified && (
              <Stack gap="xs">
                <Text size="xs" c="dimmed" className={classes.helper}>
                  받은 메일에서 이메일 인증을 완료한 뒤 로그인해 주세요.
                </Text>
                <Button
                  type="button"
                  variant="light"
                  color="skku-green"
                  size="xs"
                  leftSection={<IconMailForward size={15} />}
                  onClick={handleResend}
                  loading={resendLoading}
                  disabled={loading || cooldown > 0}
                >
                  {cooldown > 0
                    ? `인증 메일 다시 보내기 (${cooldown}초)`
                    : "인증 메일 다시 보내기"}
                </Button>
              </Stack>
            )}
            <Button
              type="submit"
              color="skku-green"
              loading={loading}
              disabled={resendLoading}
              className={classes.fullButton}
            >
              로그인
            </Button>
          </Stack>
        </form>

        <Text size="xs" c="dimmed" className={classes.subtle}>
          로그인은 선택 사항입니다. 로그인하지 않아도 모든 공지를 그대로 볼 수
          있습니다.
        </Text>

        <Stack gap="sm" className={classes.links}>
          <Group justify="space-between" gap="xs">
            <Text
              component={Link}
              href="/forgot-password"
              size="sm"
              className={classes.link}
            >
              비밀번호를 잊으셨나요?
            </Text>
            <Text
              component={Link}
              href="/signup"
              size="sm"
              className={classes.link}
            >
              계정이 없으신가요? 가입하기 <IconArrowRight size={14} />
            </Text>
          </Group>
        </Stack>

        <GoogleButton onClick={handleGoogleLogin} loading={mockGoogleActive} />
      </Stack>
    </AuthLayout>
  );
}
