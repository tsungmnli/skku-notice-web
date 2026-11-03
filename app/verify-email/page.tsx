import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { VerifyEmailClient } from "@/components/page/VerifyEmail";

export const metadata: Metadata = {
  title: "이메일 인증 | SKKU 공지",
  robots: { index: false },
  referrer: "no-referrer",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
