# Project memory

## Product intent & audience

- Next.js 기반의 날짜별 공지·안내 서비스
- 모바일 우선 캘린더 UX: 날짜를 선택하면 해당 날짜의 공지 목록을 캘린더 아래에서 확인
- 공지 즐겨찾기/북마크와 닫기 기능 제공
- 인증 기능은 API 모드와 브라우저 mock 모드를 모두 지원하도록 기반을 마련하는 중
- 현재 인증 화면이나 인증 라우트는 아직 추가하지 않음

## Brand personality & voice

- 한국어 UI와 사용자 안내 문구
- 짧고 직접적인 작업 중심의 문체
- mock 메일 안내와 오류 메시지도 핵심 행동과 이동 경로가 분명해야 함

## Visual design & UX direction

- 모바일 캘린더 상세는 bottom sheet/drawer가 아닌 캘린더 카드 바로 아래의 inline 패널 사용
- 선택 날짜 공지 목록은 자연스러운 문서 흐름으로 확장
- 캘린더와 공지 맥락을 동시에 유지하고, 불필요한 모달 인터럽트는 피함
- 인증 화면은 아직 설계·구현하지 않았으므로 기존 제품 UI 방향에 맞춰 추후 연결
- mock 메일 이벤트는 전역 Mantine 알림으로 노출하고, 링크 클릭 시 안내된 내부 경로로 이동

## Decisions, constraints & rationale

- 인증 API 계약과 mock 인증 기반만 1단계로 구현하고, 인증 화면·라우트는 범위 밖으로 유지
- API 선택은 기존 `client.ts`의 단일 진입점을 유지
- `googleLoginUrl()` 안에서만 mock/실제 API URL을 분기
  - mock: 안전한 `next`를 포함한 `/login?mock_google=1&next=...`
  - 운영 API: 계약상의 실제 Google 로그인 URL
- mock 인증 데이터는 `skku-mock-auth` localStorage 저장소에 계정·세션·인증 토큰·비밀번호 재설정 토큰을 함께 보관
- mock에서는 실제 보안 해시를 흉내 내지 않고 평문 비밀번호를 사용
- mock 메일은 저장 데이터가 아니라 모듈 간 이벤트 계약으로 전달하며, `AuthProvider`가 받아 Mantine 알림과 링크 이동을 담당
- `AuthProvider`는 앱 시작 시 인증 상태를 확인하고 전역 Providers에 연결
- API 인증 요청은 `credentials: "include"`를 사용하며, 인증 계약상 불필요한 `Authorization`·`X-Client` 헤더는 보내지 않음
- 204 응답은 `void`로 처리하고, 네트워크 오류·인증 오류·rate limit·captcha 실패를 API 계층에서 구분
- `safeNext` 유틸로 외부 또는 안전하지 않은 redirect를 차단하고 내부 경로만 허용
- Turnstile 사이트 키는 환경 설정에 따라 결정하며 Docker build ARG/ENV 연결을 지원
- 타입 검사와 lint/build가 품질 게이트이며, 제거된 UI나 legacy 참조를 남기지 않음
- 현재 단계의 mock 가입·로그인 흐름은 화면이 연결된 다음 단계에서 실제로 확인 가능

## Open questions & assumptions

- 인증 화면과 라우트의 정보 구조, 입력 검증 UI, 오류 표시 방식은 다음 단계에서 결정
- 실제 API의 Google 로그인 URL 계약은 백엔드 사양을 기준으로 연결하며, 현재 분기 지점만 고정
- mock 메일 알림의 구체적인 문구와 표시 시간은 인증 화면 연결 시 조정 가능
- 데스크톱/태블릿 캘린더 상세 레이아웃은 아직 미정
- inline 공지 패널의 전환 시간·easing은 아직 미정