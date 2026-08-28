# 오류 기록

## 2026-08-28 — middleware cookie setter 타입 오류

- 증상: `lib/supabase/middleware.ts`와 `lib/supabase/server.ts`에서 `cookiesToSet`이 implicit `any`로 추론되어 `npm run build` 실패
- 원인: `createServerClient`의 cookie adapter inline 함수에서 setter 배열 타입이 추론되지 않음
- 해결: `CookieOptions`와 cookie setter 배열 타입을 명시

## 2026-08-28 — 로그인 useSearchParams 정적 생성 오류

- 증상: `/login` 빌드 시 `useSearchParams() should be wrapped in a suspense boundary` 발생
- 원인: client 컴포넌트의 `useSearchParams()`가 페이지 최상위에서 직접 실행됨
- 해결: 로그인 폼을 별도 client 컴포넌트로 분리하고 페이지에서 `Suspense`로 감쌈
