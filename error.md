# 오류 기록

## 2026-08-28 — middleware cookie setter 타입 오류

- 증상: `lib/supabase/middleware.ts`와 `lib/supabase/server.ts`에서 `cookiesToSet`이 implicit `any`로 추론되어 `npm run build` 실패
- 원인: `createServerClient`의 cookie adapter inline 함수에서 setter 배열 타입이 추론되지 않음
- 해결: `CookieOptions`와 cookie setter 배열 타입을 명시

## 2026-08-28 — 로그인 useSearchParams 정적 생성 오류

- 증상: `/login` 빌드 시 `useSearchParams() should be wrapped in a suspense boundary` 발생
- 원인: client 컴포넌트의 `useSearchParams()`가 페이지 최상위에서 직접 실행됨
- 해결: 로그인 폼을 별도 client 컴포넌트로 분리하고 페이지에서 `Suspense`로 감쌈

## 2026-08-28 — 로컬 로그인 실패 진단

- 증상: `/login`에서 로그인을 시도해도 `이메일 또는 비밀번호를 확인해주세요.`만 표시됨
- 확인: `.env.local`의 Supabase URL·publishable key 변수명은 존재하고, 로그인 화면/브라우저 콘솔에는 렌더링 오류가 없음
- 원인 후보: Supabase Auth에 생성된 사용자가 없거나, 이메일/비밀번호가 틀렸거나, 이메일 확인이 완료되지 않음
- 추가 점검: 로그인 자체가 성공한 뒤 다시 `/login`으로 돌아오면 STEP2 migration이 적용되지 않았거나 `core.app_user` 자동 생성 trigger가 없는 상태일 수 있음
- 해결: Supabase Dashboard → Authentication → Users에서 계정을 생성·확인하고, `supabase/migrations/20260828000200_auth_rbac.sql`을 먼저 적용한 뒤 재시도

## 2026-08-28 — 로그인 상태가 계속 `로그인 중`으로 표시됨

- 증상: 로그인 요청 후 서버 보호 경로와 브라우저 세션이 맞지 않아 로그인 화면에 머무름
- 원인: 서버/middleware는 cookie session을 읽는데 브라우저 client가 `@supabase/supabase-js` localStorage session을 사용함
- 해결: 브라우저 client를 `@supabase/ssr`의 `createBrowserClient` singleton으로 교체하고, 로그인 요청에 `try/catch/finally`를 적용해 실패 시 로딩 상태를 해제

## 2026-08-28 — `supabase_migrations.schema_migrations` 조회 오류

- 증상: `relation "supabase_migrations.schema_migrations" does not exist` 발생
- 원인: Supabase 프로젝트에 migration history 메타 테이블이 없거나 SQL Editor에서 해당 내부 스키마를 조회할 수 없음
- 해결: migration history 조회 대신 `core.app_user`, `core.is_admin()`, `auth.users` trigger와 실제 RLS 정책을 직접 확인

## 2026-08-28 — 브라우저 client 교체 중 중복 반환부 오류

- 증상: `lib/supabase/client.ts`에서 `Return statement is not allowed here` 컴파일 오류
- 원인: 기존 `createClient` 반환 코드 일부가 새 함수 바깥에 남음
- 해결: 남은 기존 반환 코드와 중복 괄호를 제거하고 `createBrowserClient` singleton만 유지
## 2026-08-28 STEP4 빌드 오류

- 증상: `components/import/file-upload-panel.tsx`에서 `Expression expected`, `Expected ';', got 'Mode'`로 Next.js 빌드 실패.
- 원인: 데이터 종류 `<select>`가 self-closing(`/>`)으로 닫힌 뒤 옵션과 닫는 태그가 이어져 JSX 구문이 깨짐.
- 해결: self-closing 표기를 제거하고 옵션 목록을 `<select>...</select>` 내부에 배치함.

## 2026-08-28 STEP4 빌드 오류 2

- 증상: `Set<string> can only be iterated through...` 타입 검사 실패.
- 원인: 프로젝트 TypeScript target이 ES5라 Set spread를 직접 사용할 수 없음.
- 해결: `Array.from(new Set(...))`로 변환함.

## 2026-08-28 STEP4 빌드 오류 3

- 증상: Supabase 타입 검사에서 한국어 컬럼 select 결과를 `Record`로 변환할 수 없음.
- 원인: 생성된 Supabase 제네릭 타입이 해당 컬럼을 오류 응답 타입으로 추론함.
- 해결: 서버 repository에서 조회 결과를 `unknown`을 거쳐 명시적인 record 배열로 변환함.

## 2026-08-28 STEP4 테스트 오류

- 증상: `npm test`에서 import validation 테스트의 `ERR_MODULE_NOT_FOUND` 발생.
- 원인: Node의 TypeScript 테스트 실행 방식에서 새 상대 import에 확장자가 없었음.
- 해결: 테스트 import 경로에 `.ts` 확장자를 명시함.
- 보완: 테스트에서 연쇄 참조하는 schema/validate/types 모듈에도 확장자를 통일함.

## 2026-08-28 — Supabase 정책 중복 오류

- 증상: `policy "leadtime_plan_authenticated_select" for table "leadtime_plan" already exists` 발생.
- 원인: `20260828000200_auth_rbac.sql`이 이미 존재하는 정책을 `create policy`로 다시 생성함.
- 해결: 동일 정책을 생성하기 전에 `drop policy if exists`를 실행하도록 migration을 멱등적으로 수정함.

## 2026-08-28 — STEP5 Demand Profile 컬럼 오류

- 증상: `column "period_start" does not exist`가 `month_effect` CTE에서 발생함.
- 원인: 내부 집계 쿼리에서 `extract(month from period_start)`를 `calendar_month`라는 별칭으로 반환했는데, 외부 쿼리가 존재하지 않는 `period_start`를 다시 참조함.
- 해결: 외부 집계에서는 `calendar_month` 별칭을 사용하도록 STEP5 migration을 수정함.

## 2026-08-28 — 로그인 실패 추가 진단

- 확인: `/api/health/supabase`가 `configured: true`를 반환하고 브라우저 콘솔 오류가 없음.
- 원인 후보: Supabase Auth 사용자 미생성, 이메일 미확인, 자격 증명 오류, 또는 `core.app_user` trigger/migration 미적용.
- 개선: 로그인 화면에서 `Invalid login credentials`, `Email not confirmed`, rate limit 등 Supabase 오류를 구분해 표시하도록 수정함.
- 확인 방법: Supabase Dashboard Authentication → Users에서 계정과 이메일 인증 상태를 확인하고, SQL Editor에서 `auth.users`와 `core.app_user` 매칭 및 `on_auth_user_created_app_user` trigger를 확인함.

## 2026-08-28 — 로그인 성공 후 로그인 화면으로 복귀

- 증상: 로그인 버튼을 누르면 잠시 `로그인 중…`이 표시된 뒤 로그인 화면으로 돌아옴.
- 원인 추정: client-side `router.replace()`가 Supabase 브라우저 세션 쿠키의 반영 및 middleware 세션 확인보다 먼저 실행될 수 있음.
- 해결: 인증 성공 후 안전한 내부 `next` 경로를 `window.location.assign()`으로 전체 이동해 middleware가 갱신된 세션을 다시 확인하도록 수정함.

## 2026-08-28 — 브라우저 로그인 세션과 middleware 불일치

- 증상: 로그인 버튼을 누르면 `로그인 중…` 후 보호 페이지를 거쳐 로그인 화면으로 돌아옴.
- 원인: 브라우저 client가 저장한 인증 세션과 Next middleware가 요청 cookie에서 읽는 세션이 일치하지 않음.
- 해결: `/api/auth/login` Route Handler에서 서버 Supabase client로 로그인하고 cookie session을 설정한 뒤 클라이언트가 내부 경로로 이동하도록 변경함.

## 2026-08-28 — PowerShell npm 실행 정책 오류

- 증상: `npm.ps1 파일을 로드할 수 없습니다. 이 시스템에서 스크립트를 실행할 수 없습니다.`
- 원인: PowerShell Execution Policy가 `.ps1` 스크립트 실행을 차단함. 프로젝트나 Node.js 설치 오류가 아님.
- 즉시 해결: PowerShell에서 `npm` 대신 `npm.cmd`를 사용함.
- 대안: 필요할 때만 사용자 범위 정책을 `RemoteSigned`로 설정함.

## 2026-08-28 — Next.js `.next` 생성물 누락 오류

- 증상: `ENOENT: ... .next/server/pages/_document.js` 또는 App Router page bundle을 열 수 없음.
- 원인: 여러 Next 개발/빌드 프로세스가 같은 `.next` 폴더를 동시에 갱신하면서 캐시 생성물이 부분적으로 삭제됨.
- 해결: 실행 중인 개발 서버를 종료하고 프로젝트 내부의 생성물 `.next`를 삭제한 뒤 개발 서버를 하나만 재시작함.
- 현재 상태: 새 서버가 `http://localhost:3003`에서 정상 기동했고 `/login`이 200으로 표시됨. 3000 포트는 별도 프로세스가 사용 중임.
- 추가 확인: 동시 실행 상태에서 `Cannot find module './331.js'`도 발생해 `/api/auth/login`이 500 HTML을 반환했고, 클라이언트에서는 이를 `fetch failed`로 표시함.

## 2026-08-28 — 로그인 API `fetch failed`

- 증상: 로그인 후 `로그인 실패: fetch failed` 표시.
- 확인: Supabase Auth endpoint와 publishable key의 HTTPS 점검은 성공했으며, `/api/auth/login`은 401을 반환함.
- 원인 후보: 현재 실행 중인 Node 개발 서버의 외부 fetch 환경 문제 또는 Supabase가 반환한 인증 실패가 `fetch failed`로 전달되는 경우.
- 해결: 서버 로그인 실패 메시지가 `fetch failed`인 경우 브라우저 Supabase client로 재시도하고, 그 결과의 실제 인증 오류를 화면에 표시하도록 fallback을 추가함.
