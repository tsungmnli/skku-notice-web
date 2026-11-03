export type LegalClause = {
  id: string;
  title: string;
  body: string[];
};

export type LegalDocument = {
  effectiveDate: string;
  clauses: LegalClause[];
};

export const termsDocument: LegalDocument = {
  effectiveDate: "2026년 11월 3일",
  clauses: [
    {
      id: "purpose",
      title: "제1조 (목적)",
      body: [
        "본 약관은 서비스의 이용 조건과 절차, 그리고 이용자와 서비스 제공자 사이의 권리·의무를 정하는 것을 목적으로 합니다.",
      ],
    },
    {
      id: "definition",
      title: "제2조 (정의)",
      body: [
        "이 약관에서 사용하는 용어의 정의는 별도로 정한 바에 따릅니다.",
      ],
    },
    {
      id: "change",
      title: "제3조 (약관의 변경)",
      body: [
        "서비스 제공자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 사전에 공지합니다.",
      ],
    },
  ],
};

export const policyDocument: LegalDocument = {
  effectiveDate: "2026년 11월 3일",
  clauses: [
    {
      id: "collect",
      title: "제1조 (수집 항목)",
      body: [
        "서비스는 회원가입 시 이메일 주소를 수집합니다.",
      ],
    },
    {
      id: "purpose",
      title: "제2조 (수집 목적)",
      body: [
        "수집한 정보는 계정 식별 및 서비스 제공에 사용됩니다.",
      ],
    },
    {
      id: "retention",
      title: "제3조 (보유 기간)",
      body: [
        "회원 탈퇴 시 수집된 개인정보는 지체 없이 파기합니다.",
      ],
    },
  ],
};
