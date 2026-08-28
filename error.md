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
