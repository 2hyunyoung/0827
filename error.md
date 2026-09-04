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
## 2026-08-28 — STEP7 차트 wrapper Set 순회 빌드 오류

- 증상: `Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag` 오류로 `npm.cmd run build` 실패.
- 원인: 프로젝트 TypeScript target에서 Set spread 순회를 지원하지 않음.
- 해결: `Array.from(new Set(...))`로 변환해 동일한 모델 목록을 호환 방식으로 생성.
## 2026-08-28 — STEP7 차트 기간 목록 Set 순회 오류

- 증상: `components/chart/forecast-overlay-chart.tsx`의 `Set` spread에서 동일한 TypeScript target 오류가 재발.
- 해결: 기간 목록도 `Array.from(new Set(...))`로 변환.
## 2026-08-28 — Git index lock 권한 오류

- 증상: `git add`/`git commit` 실행 시 `.git/index.lock: Permission denied` 발생.
- 확인: 잔여 `index.lock` 파일과 실행 중인 Git 프로세스는 없었음.
- 조치: 저장소 메타데이터 쓰기 권한이 필요한 작업이므로 승인된 권한으로 커밋을 재시도.
## 2026-08-28 — Python 테스트 런처 미설치

- 증상: `py -m unittest ...` 실행 시 `py is not recognized`.
- 원인: 현재 개발 환경 PATH에 Python 런처가 설치되어 있지 않음.
- 조치: Node 테스트와 Next.js 빌드는 별도로 수행하고, Python 서비스 검증은 Python 설치 후 `python -m unittest discover -s python_forecast_service/tests -v`로 실행.
## 2026-08-28 — Python 실행 파일 미설치 확인

- 증상: `python`, `py`, `winget` 명령이 모두 인식되지 않음.
- 해결: python.org의 Windows 설치 프로그램으로 Python을 설치하고 설치 화면에서 `Add python.exe to PATH`를 선택.
## 2026-08-28 — Python은 인식되지만 pip 명령 미인식

- 증상: `python --version`은 실행되지만 `pip --version`은 인식되지 않음.
- 원인: Python Scripts 폴더가 PATH에 포함되지 않은 상태.
- 해결: `python -m pip` 형식으로 실행하면 pip PATH 설정 없이 동일하게 사용할 수 있음. pip 모듈이 없으면 `python -m ensurepip --upgrade` 실행.
## 2026-08-28 — PowerShell 가상환경 활성화 경로 오타

- 증상: `..venv\\Scripts\\Activate.ps1`를 찾을 수 없음.
- 원인: 현재 폴더의 하위 경로는 `..venv`가 아니라 ` .\\.venv`이며, PowerShell 상대 경로는 점 하나와 백슬래시를 사용함.
- 해결: ` .\\.venv\\Scripts\\Activate.ps1`가 아닌 공백 없는 ` .\\.venv\\Scripts\\Activate.ps1`를 실행.
## 2026-08-28 — 가상환경 활성화 오타 반복

- 증상: `..venv\\Scripts\\Activate.ps1` 명령을 반복 입력해 파일을 찾지 못함.
- 해결: 활성화하지 않고 `.venv\\Scripts\\python.exe -m pip`를 직접 사용하거나, 정확히 ` .\\.venv\\Scripts\\Activate.ps1` 형식으로 실행.
## 2026-08-28 — `.venv` 폴더가 생성되지 않은 상태

- 증상: 활성화 명령을 복사해도 `.venv\\Scripts\\Activate.ps1`를 찾지 못함.
- 확인: `python_forecast_service` 폴더에 `.venv`가 존재하지 않음.
- 해결: 서비스 폴더에서 `python -m venv .venv`를 먼저 실행하고 `.venv\\Scripts`가 생성됐는지 확인한 뒤 설치 진행.
## 2026-08-28 — Microsoft Store Python 별칭으로 인한 venv 미생성

- 증상: `python -m venv .venv` 후 `.venv` 폴더가 생성되지 않고 `dir .venv\\Scripts`가 실패함.
- 원인: 실제 Python 설치가 아니라 Windows App Execution Alias가 `python` 명령을 가로채는 상태로 추정됨.
- 해결: python.org의 `Windows installer (64-bit)`를 설치하고 `Add python.exe to PATH`를 체크한 뒤 새 PowerShell에서 `python --version`이 실제 버전을 출력하는지 확인.
## 2026-08-28 — Python 설치 후에도 Store 별칭 실행

- 증상: `python --version` 결과가 버전 없이 `Python`만 출력됨.
- 원인: Windows 설정의 `python.exe`/`python3.exe` App execution alias가 실제 설치 경로보다 먼저 실행됨.
- 해결: Settings → Apps → Advanced app settings → App execution aliases에서 Python 별칭을 끄고, 새 PowerShell에서 실제 설치 경로를 확인.
## 2026-08-28 — 앱 실행 별칭 목록에 Python 항목 없음

- 증상: 설정의 App execution aliases에 `python.exe`/`python3.exe` 항목이 없음.
- 다음 진단: `Get-Command python -All` 및 표준 설치 경로 검색으로 실제 실행 파일과 PATH 등록 상태를 확인.
## 2026-08-28 — Python 재설치 후에도 WindowsApps 경로 우선

- 증상: 재설치 후에도 `where.exe python`이 `WindowsApps\\python.exe`만 반환.
- 판단: 실제 설치 파일이 PATH에 등록되지 않았거나 설치 위치가 표준 경로와 다름.
- 다음 조치: 표준 Program Files 및 LocalAppData에서 실제 `python.exe`를 검색하고, 발견된 경로를 직접 실행해 설치 상태를 확인.
## 2026-08-28 — Stockout KPI View 집계 타입 충돌

- 증상: `cannot change data type of view column "n_items" from bigint to integer`.
- 원인: 기존 `count(*)` 집계 View 컬럼은 `bigint`인데 STEP9 View가 `integer`로 교체하려고 함.
- 해결: `n_items`, 상태별 건수, `n_within_30d`를 기존과 동일한 `bigint`로 명시.
## 2026-08-28 — Safety Stock 정책 JSONB 집계 오류

- 증상: `function max(jsonb) does not exist`.
- 원인: `config_value->'z_value_by_grade'` JSONB에 `max()` 집계를 적용함.
- 해결: 활성 `service_level_z` 정책을 최신 1건 서브쿼리로 조회하도록 변경.
## 2026-08-28 — Lead Time View에 std_days 컬럼 없음

- 증상: `column le.std_days does not exist`.
- 원인: 현재 DB의 `core.v_leadtime_effective`에는 `std_days`가 포함되어 있지 않음.
- 해결: Lead Time 변동성 및 P50/P80/P90을 원천 통계 View인 `core.v_leadtime_stat`에서 직접 조회하도록 수정.
## 2026-08-28 — Purchase Recommendation Lead Time 별칭 오류

- 증상: `column "effective_leadtime" does not exist`.
- 원인: 최종 SELECT에서 별칭을 컬럼처럼 중복 참조함.
- 해결: 실제 컬럼 `effective_lead_time`에 `effective_leadtime` 별칭을 한 번만 지정.

## 2026-08-28 — STEP10 Purchase Recommendation CTE 구문 오류

- 증상: 최종 `select` 구문에서 `syntax error at or near "select"` 발생.
- 원인: SQL Editor에 일부 구문만 복사되거나 CTE 이름 `required`가 환경에 따라 최종 SELECT 경계에서 모호하게 해석될 수 있었음.
- 해결: CTE 이름을 `requirements`로 명확히 변경하고, 최종 Risk 상태는 이미 `base`에서 조회한 `risk_status`를 직접 사용하도록 수정함.
## 2026-09-04 — 대용량 실데이터 적재 SQL 실행 한도

- 증상: `02-data-01` 전체 SQL을 Supabase SQL Editor에 한 번에 붙여넣거나 실행하기 어려움.
- 원인: 파일이 약 2MB이고 대형 `INSERT` 문 56개(총 27,645행)를 하나의 입력으로 묶어 SQL Editor 입력/실행 한도에 걸릴 수 있음.
- 해결: 완결된 `INSERT` 문 경계를 보존한 `sql/02-data-01-parts/part-01.sql`부터 `part-09.sql`까지의 순차 실행본으로 분할함. `README.md`의 실행 순서를 따름.

## 2026-09-04 — part-06 중복 키 오류

- 증상: `part-06.sql` 실행 시 `duplicate key value violates unique constraint "dim_item_pkey"`, `item_code=173K47049` 발생.
- 확인: 원본 SQL과 분할본에서 `173K47049`는 한 번만 존재함. 따라서 분할 중복이 아니라 해당 행이 이전 실행 또는 기존 데이터로 이미 DB에 적재된 상태임.
- 해결: 모든 분할 INSERT에 `ON CONFLICT (item_code) DO NOTHING`을 추가하고, `dim_model`에는 `ON CONFLICT (model_key) DO NOTHING`을 추가함. 실패한 파트부터 재실행하면 기존 행은 건너뛰고 누락된 행만 적재됨.

## 2026-09-04 — part-06 ON CONFLICT 구문 인식 오류

- 증상: `syntax error at or near "'179K40778'"`가 발생하며 마지막 튜플 뒤의 충돌 처리 절에서 실행 실패.
- 원인: SQL Editor에서 컬럼 지정형 충돌 절을 포함한 대형 다중 행 INSERT의 구문을 정상 인식하지 못한 것으로 판단됨.
- 해결: 충돌 대상 컬럼을 생략한 PostgreSQL 표준형 `ON CONFLICT DO NOTHING`으로 변경하고, INSERT 마지막 튜플 다음 줄에 배치함.

## 2026-09-04 — part-06 대형 VALUES 블록 구문 오류 재발

- 증상: `part-06.sql`에서 `179K40778` 행 부근에 동일한 `42601` 구문 오류가 반복됨.
- 원인: SQL Editor가 500행 단위의 대형 다중 행 `VALUES` 블록을 처리하는 중 구문 오류 위치를 잘못 해석하는 것으로 판단됨.
- 해결: 전체 분할본의 INSERT를 최대 100행 단위로 재분할하고, 각 블록 마지막에 `ON CONFLICT DO NOTHING`을 유지함. `part-06.sql`부터 다시 실행함.

## 2026-09-04 — 02-data-02 part-03 재실행 중복 키 오류

- 증상: `part-03.sql` 실행 시 `duplicate key value violates unique constraint "dim_item_pkey"`, `item_code=537K13576` 발생.
- 확인: `537K13576`은 02-data-02 원본에 한 번만 존재하며 part-03의 첫 행임. part-03이 이전에 일부 실행되어 해당 행이 이미 적재된 상태임.
- 해결: 02-data-02의 INSERT를 최대 100행 단위로 재분할하고 각 블록에 `ON CONFLICT DO NOTHING`을 적용함. 원본과 동일한 28,000행이 유지되는 것을 확인함.

## 2026-09-04 — 02-data-02 part-03 중복 키 오류

- 증상: `part-03.sql` 실행 시 `duplicate key value violates unique constraint "dim_item_pkey"`, `item_code=537K13576` 발생.
- 확인: 원본 SQL과 02-data-02 분할본에서 `537K13576`은 한 번만 존재하므로, part-03을 이전에 일부 실행해 해당 행이 이미 적재된 상태임.
- 해결: 02-data-02의 모든 INSERT를 최대 100행 단위로 재분할하고 `ON CONFLICT DO NOTHING`을 추가함. part-03부터 재실행하면 기존 행은 건너뛰고 누락된 행만 적재됨.

## 2026-09-04 — PowerShell npm 실행 정책 오류 재발

- 증상: `npm test` 실행 시 `C:\Program Files\nodejs\npm.ps1`을 로드할 수 없고 `PSSecurityException` 발생.
- 원인: PowerShell 실행 정책이 `.ps1` 스크립트 실행을 차단함. npm 또는 프로젝트 오류가 아님.
- 해결: 실행 정책을 변경하지 않고 `npm.cmd test`를 사용함. TypeScript 검사는 `npx.cmd tsc --noEmit`으로 실행함.

## 2026-09-04 — Git 커밋·푸시 권한 및 연결 오류

- 증상: `git add`/`git commit`에서 `.git/index.lock: Permission denied`, `git push`에서 GitHub `443` 연결 실패가 발생함.
- 확인: `.git/index.lock` 잔여 파일과 실행 중인 Git 프로세스는 없음.
- 조치: 저장소 메타데이터 쓰기와 외부 GitHub 연결 권한이 필요한 작업으로 확인되어 승인된 권한으로 커밋·푸시를 재시도함.
