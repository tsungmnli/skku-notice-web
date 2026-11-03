"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Center, Loader, useMantineColorScheme } from "@mantine/core";
import { isMockMode, turnstileSiteKey } from "@/lib/auth/config";

type TurnstileRenderOptions = {
  sitekey: string;
  theme: "light" | "dark";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  resetKey?: number;
  onToken: (token: string | null) => void;
  onError: () => void;
};

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({ resetKey = 0, onToken, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isMockMode) {
      onToken("mock");
      return;
    }

    if (!turnstileSiteKey || !containerRef.current) {
      onError();
      return;
    }

    const widgetTheme = colorScheme === "dark" ? "dark" : "light";
    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: turnstileSiteKey as string,
        theme: widgetTheme,
        callback: onToken,
        "expired-callback": () => onToken(null),
        "error-callback": () => {
          onToken(null);
          onError();
        },
      });
      setWidgetReady(true);
    };

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript && window.turnstile) {
      renderWidget();
    } else {
      const script = existingScript ?? document.createElement("script");
      if (!existingScript) {
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
      }
      script.addEventListener("load", renderWidget, { once: true });
      script.addEventListener("error", onError, { once: true });
      if (!existingScript) document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      setWidgetReady(false);
    };
  }, [colorScheme, onError, onToken]);

  useEffect(() => {
    if (isMockMode || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    onToken(null);
  }, [onToken, resetKey]);

  if (isMockMode) return null;

  if (!turnstileSiteKey) {
    return (
      <Alert color="red" variant="light" role="alert">
        회원가입을 일시적으로 사용할 수 없습니다.
      </Alert>
    );
  }

  return (
    <Center mih={70} ref={containerRef}>
      {!widgetReady && <Loader size="sm" />}
    </Center>
  );
}
