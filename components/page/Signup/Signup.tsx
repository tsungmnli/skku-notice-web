"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { AuthLayout, GoogleButton } from "@/components/page/Auth";
import { TurnstileWidget } from "@/components/common/TurnstileWidget/TurnstileWidget";
import { ApiError, api } from "@/lib/api/client";
import { turnstileUnavailable } from "@/lib/auth/config";
import { useAuth } from "@/hooks/useAuth";
import classes from "@/components/page/Auth/Auth.module.css";

export function SignupClient() {
  const router = useRouter();
  const { status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
    if (token) setError(null);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
    setError("사람인지 확인하지 못했습니다. 다시 시도해 주세요.");
  }, []);

  const startCooldown = (seconds: number | undefined) => {
    setCooldown(Math.max(1, seconds ?? 60));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (turnstileUnavailable) {
      setError("회원가입을 일시적으로 사용할 수 없습니다.");
      return;
    }
    if (!turnstileToken) {
      setError("사람인지 확인을 완료해 주세요.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("비밀번호는 8~128자로 입력해 주세요.");
      return;
    }
    if (name.length > 100) {
      setError("이름은 100자 이하로 입력해 주세요.");
      return;
    }
    if (!agreed) {
      setError("이용약관과 개인정보처리방침에 동의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const result = await api.register({
        email,
        password,
        ...(name.trim() ? { name: name.trim() } : {}),
        turnstile_token: turnstileToken,
      });
      setMessage(result.detail);
      setSubmitted(true);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError(
        caught instanceof Error
          ? caught.message
          : "회원가입 중 오류가 발생했습니다.",
      );
      setTurnstileToken(null);
      setTurnstileResetKey((value) => value + 1);
      if (apiError?.code === "rate_limited") {
        startCooldown(apiError.retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    setResendLoading(true);
    try {
      const result = await api.resendVerification(email);
      setMessage(result.detail);
      startCooldown(60);
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError(
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
    if (!agreed) return;
    setGoogleLoading(true);
    window.location.assign(api.googleLoginUrl());
  };

  if (status === "loading" || status === "authenticated") return null;

  if (submitted) {
    return (
      <AuthLayout title="메일을 확인해 주세요">
        <Stack gap="md">
          {message && (
            <Alert color="skku-green" variant="light" role="status">
              {message}
            </Alert>
          )}
          {error && (
            <Alert color="red" variant="light" role="alert">
              {error}
            </Alert>
          )}
          <Text size="sm" c="dimmed" className={classes.subtle}>
            입력한 이메일에서 인증 링크를 확인해 주세요. 메일이 보이지 않으면 스팸함을 확인해 주세요.
          </Text>
          <Button
            type="button"
            variant="light"
            color="skku-green"
            onClick={handleResend}
            loading={resendLoading}
            disabled={cooldown > 0}
            className={classes.fullButton}
          >
            {cooldown > 0
              ? `인증 메일 다시 보내기 (${cooldown}초)`
              : "인증 메일 다시 보내기"}
          </Button>
          <Text component={Link} href="/login" size="sm" className={classes.link}>
            로그인으로 돌아가기
          </Text>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="회원가입" description="공지사항 서비스를 위한 계정을 만듭니다.">
      <Stack gap="lg">
        {error && (
          <Alert color="red" variant="light" role="alert">
            {error}
          </Alert>
        )}
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
            <PasswordInput
              label="비밀번호"
              description="8~128자로 입력해 주세요."
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              disabled={loading}
            />
            <TextInput
              label="이름"
              description="선택 사항입니다."
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              maxLength={100}
              disabled={loading}
            />

            <Stack gap="xs">
              <Text size="sm" fw={600}>
                사람인지 확인
              </Text>
              <TurnstileWidget
                resetKey={turnstileResetKey}
                onToken={handleTurnstileToken}
                onError={handleTurnstileError}
              />
            </Stack>

            <Stack gap="xs">
              <Checkbox
                label={
                  <Text size="sm" className={classes.legal}>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener"
                      className={classes.legalLink}
                    >
                      이용약관
                    </a>{" "}
                    및{" "}
                    <a
                      href="/policy"
                      target="_blank"
                      rel="noopener"
                      className={classes.legalLink}
                    >
                      개인정보처리방침
                    </a>
                    에 동의합니다(필수)
                  </Text>
                }
                checked={agreed}
                onChange={(event) => setAgreed(event.currentTarget.checked)}
                disabled={loading}
              />
            </Stack>

            <Button
              type="submit"
              color="skku-green"
              loading={loading}
              disabled={
                turnstileUnavailable ||
                !turnstileToken ||
                !agreed
              }
              className={classes.fullButton}
            >
              회원가입
            </Button>
          </Stack>
        </form>

        <Group justify="center" className={classes.links}>
          <Text size="sm" c="dimmed">
            이미 계정이 있으신가요?{" "}
            <Text component={Link} href="/login" span className={classes.link}>
              로그인
            </Text>
          </Text>
        </Group>
        <Text size="xs" c="dimmed" className={classes.subtle}>
          로그인은 선택 사항입니다. 로그인하지 않아도 모든 공지를 그대로 볼 수 있습니다.
        </Text>

        <GoogleButton
          onClick={handleGoogleLogin}
          loading={googleLoading}
          disabled={!agreed}
        />
      </Stack>
    </AuthLayout>
  );
}
