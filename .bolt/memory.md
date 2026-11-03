# Project memory

## Product intent & audience

- Next.js 기반의 날짜별 공지·안내 서비스
- 모바일 우선 캘린더 UX: 날짜를 선택하면 해당 날짜의 공지 목록을 캘린더 아래에서 확인
- 공지 즐겨찾기/북마크와 닫기 기능 제공
- 인증 기능은 API 모드와 브라우저 mock 모드를 모두 지원
- 인증 화면 및 라우트가 추가되었으며, 가입·이메일 인증·비밀번호 재설정 흐름을 mock에서도 연결하는 단계

## Brand personality & voice

- 한국어 UI와 사용자 안내 문구
- 짧고 직접적인 작업 중심의 문체
- 인증 안내와 오류 메시지는 핵심 행동과 이동 경로를 분명히 표시
- 비밀번호 재설정 관련 서버 `detail` 문구는 성공 시 변형하지 않고 그대로 노출

## Visual design & UX direction

- 모바일 캘린더 상세는 bottom sheet/drawer가 아닌 캘린더 카드 바로 아래 inline 패널 사용
- 선택 날짜 공지 목록은 자연스러운 문서 흐름으로 확장
- 불필요한 모달 인터럽트보다 현재 맥락을 유지하는 inline 안내와 전역 알림 선호
- 인증 화면은 기존 제품 UI 방향에 맞춘 `AuthLayout` 및 공통 CSS 패턴 사용
- 비밀번호 입력에는 표시/숨김 토글 제공
- 재전송 대기 시간과 429 `Retry-After`는 사용자가 남은 시간을 알 수 있는 카운트다운으로 표시
- 인증 관련 페이지는 검색 색인 제외; reset-password 페이지는 `referrer: no-referrer`

## Decisions, constraints & rationale

- 3단계에서 `/forgot-password`와 `/reset-password` 페이지 및 라우트를 추가
- `/login`에서 forgot-password로 이동할 때 이메일을 URL 쿼리에 포함하지 않으며, 입력칸은 빈 상태로 시작
- `/forgot-password`
  - 이메일 하나로 `forgot-password` 호출
  - 성공 시 서버 `detail`만 표시해 계정 존재 여부를 노출하지 않음
  - 안내에 링크 1시간 유효, 재설정 후 모든 기기 로그아웃, Google 가입자도 비밀번호 설정 가능하다는 내용을 포함
  - 안내 상태에서 재전송은 60초 쿨다운
  - 429는 `Retry-After` 기반 카운트다운, 422와 네트워크 오류를 별도 처리
- `/reset-password?token=...`
  - 토큰을 읽은 즉시 `router.replace`로 URL에서 제거하고 React state에만 보관
  - 토큰을 localStorage 등 영구 저장소에 저장하지 않음
  - 새 비밀번호는 8~128자이며 확인 입력과 표시 토글을 제공
  - `reset-password({ token, password })` 호출
  - 성공 시 서버 `detail`을 알림으로 표시하고 자동 로그인 없이 `/login`으로 이동
  - `invalid_token`은 만료·이미 사용된 링크 안내와 `/forgot-password` 이동 버튼을 제공
  - 토큰 없이 접근하면 `/forgot-password`로 안내
  - 422·네트워크 오류에서는 토큰을 state에 유지해 같은 화면에서 재시도
  - 성공 또는 `invalid_token` 처리 후 토큰 폐기
- mock 흐름은 가입 → 이메일 인증 → forgot-password → 메일 알림 링크 → reset-password → login 순서로 연결
- mock/API 인증 계층의 기존 계약과 `safeNext`, 전역 Mantine 알림 구조를 유지
- 재전송 버튼은 form submit 이벤트 핸들러를 직접 재사용하지 않고, 공통 비동기 전송 로직과 별도 이벤트 핸들러로 분리
- 변경 파일은 `components/page/ForgotPassword/ForgotPassword.tsx`, 해당 `index.ts`, `app/forgot-password/page.tsx`, `components/page/ResetPassword/ResetPassword.tsx`, 해당 `index.ts`, `app/reset-password/page.tsx`
- 사용자 요청상 3단계에서 멈추며, 이후 작업은 별도 지시가 필요

## Open questions & assumptions

- 실제 API의 `detail`, 422 오류 형식, `Retry-After` 단위가 mock과 항상 동일한지는 백엔드 계약 확인 필요
- 인증 페이지의 세부 스타일과 데스크톱 레이아웃은 기존 `AuthLayout` 확장 시 조정 가능
- `/reset-password`의 토큰 제거는 클라이언트 라우팅 이후 새로고침 시 재시도 불가한 의도된 동작으로 간주