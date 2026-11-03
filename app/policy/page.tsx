import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/page/Legal";
import { policyDocument } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "개인정보처리방침 | SKKU 공지",
};

export default function PolicyPage() {
  return (
    <LegalDocumentView title="개인정보처리방침" document={policyDocument} />
  );
}
