import type { Metadata } from "next";
import { AccountClient } from "@/components/page/Account";

export const metadata: Metadata = {
  title: "내 계정 | SKKU 공지",
  robots: { index: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
