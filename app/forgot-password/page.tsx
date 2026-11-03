import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { ForgotPasswordClient } from "@/components/page/ForgotPassword";

export const metadata: Metadata = {
  title: "비밀번호 재설정 | SKKU 공지",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
