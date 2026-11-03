import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { ResetPasswordClient } from "@/components/page/ResetPassword";

export const metadata: Metadata = {
  title: "비밀번호 재설정 | SKKU 공지",
  robots: { index: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
