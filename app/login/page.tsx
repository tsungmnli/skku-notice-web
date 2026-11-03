import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { LoginClient } from "@/components/page/Login";

export const metadata: Metadata = {
  title: "로그인 | SKKU 공지",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <LoginClient />
    </Suspense>
  );
}
