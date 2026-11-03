# Project memory

## Product intent & audience

- Next.js 기반의 날짜별 공지·안내 서비스
- 모바일 우선 캘린더 UX: 날짜를 선택하면 해당 날짜의 공지 목록을 캘린더 아래에서 확인
- 공지 즐겨찾기/북마크와 닫기 기능 제공
- 인증 기능은 API 모드와 브라우저 mock 모드를 모두 지원
- 인증 흐름은 가입·이메일 인증·비밀번호 재설정·Google 로그인·계정 관리까지 연결됨

## Brand personality & voice

- 한국어 UI와 사용자 안내 문구
- 짧고 직접적인 작업 중심의 문체
- 인증 안내와 오류 메시지는 핵심 행동과 이동 경로를 분명히 표시
- 비밀번호 재설정 관련 서버 `detail` 문구는 성공 시 변형하지 않고 그대로 노출
- 법률 문서는 과장하거나 임의의 법률 문구를 추가하지 않고 짧은 자리 표시 문장으로 유지

## Visual design & UX direction

- 모바일 캘린더 상세는 bottom sheet/drawer가 아닌 캘린더 카드 바로 아래 inline 패널 사용
- 선택 날짜 공지 목록은 자연스러운 문서 흐름으로 확장
- 불필요한 모달 인터럽트보다 현재 맥락을 유지하는 inline 안내와 전역 알림 선호
- 인증 화면은 기존 제품 UI 방향에 맞춘 `AuthLayout` 및 공통 CSS 패턴 사용
- Google 로그인은 새 의존성 없이 인라인 SVG 로고 버튼으로 제공
- 헤더에는 로그인 버튼 또는 이메일·이름을 보여주는 사용자 메뉴를 제공하며, 인증 로딩 중에도 동일한 크기의 placeholder로 레이아웃을 유지
- 모바일 하단 탭에서도 계정 진입이 가능하도록 계정 탭을 추가하고 기존 탭 3개와 테마 토글은 유지
- 비밀번호 입력에는 표시/숨김 토글 제공
- 재전송 대기 시간과 429 `Retry-After`는 사용자가 남은 시간을 알 수 있는 카운트다운으로 표시
- 인증 및 계정 페이지는 검색 색인 제외; reset-password 페이지는 `referrer: no-referrer`
- `/terms`, `/policy`는 서버 컴포넌트 정적 문서 페이지로, 제한된 본문 폭·명확한 제목 계층·앵커 가능한 소제목을 사용
- 법률 문서 페이지는 모바일에서 읽기 편한 간격과 두 색 테마를 지원하며, 상단에 시행일을 표시
- 푸터 링크는 모바일 하단 탭에 가려지지 않도록 하단 여백을 확보

## Decisions, constraints & rationale

- `/login`, `/signup`에 `Google로 계속하기` 버튼 추가
  - 실제 API 모드에서는 `window.location.assign(api.googleLoginUrl(safeNext(next)))`로 이동하며 fetch는 사용하지 않음
  - 회원가입에서는 약관 동의 전 버튼 비활성화
  - mock에서는 `mock_google` 흐름으로 가짜 Google 로그인 후 원래 `next`로 이동
- 헤더 비로그인 상태는 현재 경로를 `safeNext` 처리한 `/login?next=...` 진입점 제공
- 로그인 상태 사용자 메뉴에서 이메일·이름, `내 계정`, `로그아웃` 제공
- `/account`
  - 로그인 필요; 비로그인 접근 시 깜빡임 없이 `/login?next=/account`로 이동
  - 이메일, 이름, 이메일 인증 상태, 로그인 방식(`has_password`/`google_linked`), 서울 시간 기준 가입일 표시
  - 로그아웃은 성공·실패와 관계없이 anonymous 상태로 전환 후 `/`로 이동
  - 계정 삭제는 확인 모달 사용
  - `has_password` 계정은 비밀번호를 요구하고, 그 외에는 본문 없이 삭제 호출
  - 확인 문구에 `서버의 계정 데이터가 삭제되며, 이 브라우저의 즐겨찾기는 삭제되지 않습니다`를 정확히 포함
  - `invalid_credentials`는 서버 문장 표시 후 재시도, 429는 카운트다운
  - `reauth_required`는 재로그인 안내와 `next=/account`인 Google 재로그인 버튼 제공
  - 삭제 성공 시 anonymous 상태로 전환하고 알림 후 `/`로 이동
- mock에서 Google 가짜 로그인 → `/account` → 계정 삭제 → 재인증 안내 흐름을 지원
- 기존 인증 계층, API 계약, `safeNext`, 전역 Mantine 알림 구조를 유지
- 이용약관·개인정보처리방침 본문은 `lib/legal/documents.ts`의 배열 데이터로 분리해 추후 본문만 교체 가능
- `/terms`와 `/policy`의 자리 표시 본문은 각각 2~3개 조항 수준으로 유지하며 법률 문구를 임의로 작성하지 않음
- 푸터에 `/terms`, `/policy`, `mailto:admin@tsungmn.com` 링크를 추가하고 기존 푸터 문구는 유지
- `/signup` 약관 동의는 단일 필수 체크박스인 `이용약관과 개인정보처리방침에 동의합니다(필수)`로 통합
  - 약관 및 개인정보처리방침 링크는 각각 새 탭으로 연결
- 관련 구현 파일: `components/page/Auth/GoogleButton.tsx`, Auth index, Login/Signup, Header 및 스타일, BottomTabs, Account 및 스타일/index, `app/account/page.tsx`, `lib/api/client.ts`, `utils/date.ts`, `lib/legal/documents.ts`, `components/page/Legal/*`, `app/terms/page.tsx`, `app/policy/page.tsx`, `components/common/Footer/*`

## Open questions & assumptions

- 실제 API의 `detail`, 422 오류 형식, `Retry-After` 단위가 mock과 항상 동일한지는 백엔드 계약 확인 필요
- 인증·계정 페이지의 세부 스타일과 데스크톱 레이아웃은 기존 공통 레이아웃 확장에 따라 조정 가능
- `/reset-password`의 토큰 제거는 클라이언트 라우팅 이후 새로고침 시 재시도 불가한 의도된 동작으로 간주
- Google OAuth 실제 콜백 및 서버의 계정 삭제 응답 계약은 mock 구현과 별도 확인 필요
- 약관 및 개인정보처리방침의 실제 법률 문구는 추후 확정해 자리 표시 본문과 교체해야 함