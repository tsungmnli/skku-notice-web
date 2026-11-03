import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { SignupClient } from "@/components/page/Signup";

export const metadata: Metadata = {
  title: "회원가입 | SKKU 공지",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton h={620} radius="md" m="md" />}>
      <SignupClient />
    </Suspense>
  );
}
