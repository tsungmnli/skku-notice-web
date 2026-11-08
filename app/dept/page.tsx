import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { DeptClient } from "@/components/page/Dept";

export const metadata: Metadata = {
  title: "학과 공지 | SKKU 공지",
};

export default function DeptPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <DeptClient />
    </Suspense>
  );
}
