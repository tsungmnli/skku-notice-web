import type { Metadata } from "next";
import { NoticesClient } from "@/components/page/Notices";

export const metadata: Metadata = {
  title: "공지사항 | SKKU 공지",
};

export default function NoticesPage() {
  return <NoticesClient />;
}
