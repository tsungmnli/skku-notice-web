import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@mantine/core";
import { CalendarClient } from "@/components/page/Calendar";

export const metadata: Metadata = {
  title: "캘린더 | SKKU 공지",
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<Skeleton h={520} radius="md" m="md" />}>
      <CalendarClient />
    </Suspense>
  );
}
