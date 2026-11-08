import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { DeptEditClient } from "@/components/page/Dept/DeptEdit";

export const metadata: Metadata = {
  title: "학과 편집 | SKKU 공지",
};

export default function DeptEditPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <DeptEditClient />
    </Suspense>
  );
}
