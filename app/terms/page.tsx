import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/page/Legal";
import { termsDocument } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "이용약관 | SKKU 공지",
};

export default function TermsPage() {
  return <LegalDocumentView title="이용약관" document={termsDocument} />;
}
