"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";
import { api, ApiError } from "@/lib/api/client";
import {
  MOCK_MAIL_EVENT,
  type MockMailEventDetail,
} from "@/lib/auth/mockEvents";
import { AuthContext } from "@/hooks/useAuth";
import type { User } from "@/lib/api/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">(
    "loading",
  );
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextUser = await api.getMe();
      setUser(nextUser);
      setStatus("authenticated");
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        setUser(null);
        setStatus("anonymous");
        return;
      }
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const signIn = useCallback((nextUser: User) => {
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextUser = await api.getMe();
        if (cancelled) return;
        setUser(nextUser);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus("anonymous");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleMockMail = (event: Event) => {
      const detail = (event as CustomEvent<MockMailEventDetail>).detail;
      if (!detail?.href || !detail.subject) return;
      notifications.show({
        title: "Mock 메일 안내",
        message: (
          <span>
            {detail.subject} ·{" "}
            <a href={detail.href}>메일 링크 열기</a>
          </span>
        ),
        autoClose: false,
        color: "skku-green",
      });
    };

    window.addEventListener(MOCK_MAIL_EVENT, handleMockMail);
    return () => window.removeEventListener(MOCK_MAIL_EVENT, handleMockMail);
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut, refresh }),
    [refresh, signIn, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
