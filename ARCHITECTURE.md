# 기기·옵션 월간 발주계획 MVP 아키텍처

> 작성 기준: 2026-08-27
>
> 이 문서는 저장소의 현재 코드와 설정을 기준으로 작성했다. PRD에 정의되어 있지만 아직 화면·서비스·저장 로직으로 연결되지 않은 기능은 `미구현/다음 단계`로 구분한다.

## 1. 프로젝트 한눈에 보기

한국후지필름BI의 월간 발주계획 업무를 웹 화면으로 보여주는 Next.js 15 프로토타입이다. 현재 구현은 두 축으로 구성된다.

1. `/` 경로의 업무 흐름 데모: 전체 현황 → 수요 확정 → 재고·공급 → 마스터 검증 → 발주량 계산 → 보고자료
2. `/analysis/*` 경로의 데이터 분석 화면: Supabase `analytics` 뷰를 조회하는 리드타임 분석

화면은 React 컴포넌트와 순수 CSS로 구성되고, 분석 화면의 데이터는 서버 컴포넌트에서 `lib/scm.ts`를 통해 Supabase PostgreSQL을 조회한다. Supabase 원본 `raw` 스키마는 화면에서 직접 조회하지 않으며, `core`와 `analytics` 계층을 통해 정제·계산된 결과를 사용한다.

현재 홈 업무 흐름의 대부분은 대표 샘플값을 렌더링하는 Phase 1 프로토타입이다. 반면 리드타임 분석 화면은 `analytics.v_leadtime_gap`을 실제 조회하는 데이터 연결 예시이며, 정규화·오류 표시·테이블 재사용 구조를 갖추고 있다.

## 2. 폴더별 요약

| 폴더/위치 | 기능 요약 | 주요 파일 |
|---|---|---|
| `app/` | Next.js App Router의 페이지, 레이아웃, API Route, 전역 스타일 | `layout.tsx`, `page.tsx`, `analysis/`, `api/`, `globals.css` |
| `app/analysis/` | 분석 화면 공통 레이아웃과 분석 라우트 | `layout.tsx`, `leadtime/page.tsx` |
| `app/api/health/` | Supabase 연결 상태 확인용 헬스 체크 API | `supabase/route.ts` |
| `components/` | 화면을 구성하는 React 컴포넌트 | `procurement-app.tsx`, `analysis/`, `workflow/` |
| `components/analysis/` | 분석 화면의 공통 프레임, 탭, 데이터 테이블 | `analysis-frame.tsx`, `analysis-tabs.tsx`, `data-table.tsx` |
| `components/workflow/` | 홈 업무 흐름의 각 단계별 화면 | `*-step.tsx`, `step-frame.tsx` |
| `lib/` | 도메인 모델, 데이터 조회, Supabase 클라이언트 | `scm.ts`, `scm-model.ts`, `supabase.ts`, `supabase/` |
| `sql/` | Supabase 권한과 RLS 정책을 수동 적용하는 SQL | `01-grants.sql`, `02-policies.sql` |
| `supabase/` | Supabase CLI 설정과 버전 관리 마이그레이션 | `config.toml`, `migrations/` |
| `docs/` | 실습·운영 안내와 구현 계획 문서 | `04-실습안내.md`, `superpowers/` |
| `outputs/` | 생성된 업무 정의서 Excel과 렌더링 미리보기 산출물 | `.xlsx`, `.png`, `.ndjson` |
| 저장소 루트 | 프로젝트 설정, 요구사항, 데이터 덤프, 생성 스크립트 | `package.json`, `README.md`, `SCHEMA.md`, `dump.sql` 등 |

## 3. 아키텍처와 데이터 흐름

### 3.1 현재 애플리케이션 흐름

```text
브라우저
  ├─ GET /                 → app/page.tsx
  │                           → ProcurementApp
  │                           → workflow/* 샘플 화면
  └─ GET /analysis/leadtime → app/analysis/layout.tsx
                              → app/analysis/leadtime/page.tsx
                              → lib/scm.ts
                              → lib/supabase/server.ts
                              → Supabase analytics.v_leadtime_gap
```

홈 화면은 `ProcurementApp`이 현재 단계(`StepId`)를 상태로 관리하고, 단계별 컴포넌트를 조건부 렌더링한다. 분석 화면은 App Router 서버 컴포넌트에서 조회 함수를 호출하고, 결과를 공통 분석 테이블에 전달한다.

### 3.2 데이터 계층 원칙

```text
raw       원본 CSV 적재 데이터. 직접 수정·화면 조회 금지
  ↓
core      공급처 매핑, 기준값, 정제·계산용 뷰와 확정 테이블
  ↓
analytics 화면·AI가 읽는 계산 결과 뷰
  ↓
lib/scm   스키마를 명시한 조회 함수
  ↓
page      조회 오류/빈 결과를 구분해 화면에 표시
```

분석 화면은 `analytics` 스키마를 명시해 조회한다. 뷰 컬럼명이 바뀌어도 화면이 깨지지 않도록 `lib/scm-model.ts`에서 컬럼 후보를 여러 개 받아 화면용 모델로 정규화한다. 평균·분위수·소진일 등 핵심 수치 계산은 화면이 아니라 DB 뷰에서 수행하는 것이 프로젝트 규칙이다.

### 3.3 구현 상태와 설계 상태의 차이

PRD는 초기 SQLite 기반 MVP를 설명하지만, 현재 저장소에는 Supabase 클라이언트와 PostgreSQL 마이그레이션이 포함되어 있다. 따라서 현재 코드는 `Supabase 연결이 준비된 프로토타입`으로 보는 것이 정확하다.

- 구현됨: 홈 업무 흐름 시연, 리드타임 분석 조회, Supabase 연결 헬스 체크, 수요확정 관련 기본 PostgreSQL 테이블 마이그레이션
- 샘플 수준: 수요·재고·마스터·계산·보고 화면의 값과 편집 상태
- 미연결: 실제 저장/재조회, 파일 업로드, 발주량 계산 서비스, 수동 조정 이력, Excel/PDF 다운로드, 인증·권한

## 4. `app/` 상세

### `app/layout.tsx`

애플리케이션 전체 Root Layout이다. `globals.css`를 전역으로 가져오고 HTML 언어를 `ko`로 지정한다. 브라우저 탭 제목과 설명을 `metadata`로 설정하며, 모든 페이지의 `children`을 `<body>` 안에 렌더링한다.

### `app/page.tsx`

루트 경로(`/`)의 진입점이다. 비즈니스 로직을 두지 않고 `ProcurementApp`을 반환해 홈 업무 흐름을 위임한다.

### `app/analysis/layout.tsx`

`/analysis/*` 하위 분석 페이지의 공통 레이아웃이다. 홈으로 돌아가는 링크와 `AnalysisTabs`를 상단에 배치하고 하위 페이지를 `children`으로 렌더링한다. 탭 목록은 이 파일에 두지 않고 `components/analysis/analysis-tabs.tsx`에서 관리한다.

### `app/analysis/leadtime/page.tsx`

공급처별 마스터 리드타임과 실제 P80의 차이를 보여주는 서버 분석 페이지다.

- `dynamic = 'force-dynamic'`으로 페이지 캐시를 피한다.
- `getLeadtimeGap()`을 호출해 데이터 접근을 `lib`에 위임한다.
- 조회 오류는 실패 메시지로 표시하고, 정상 조회 결과로 공급처 수·실제 리드타임이 더 긴 공급처 수·표본 부족 수를 계산한다.
- 컬럼 정의는 `DataTable`의 `Column<LeadtimeGap>[]`로 선언한다.
- 양수 격차는 위험(`text-danger`), 음수 격차는 양호(`text-good`), `null`은 `—`로 표시한다.

이 파일은 새 분석 화면을 추가할 때 따라야 하는 기준 구현이다. 새 화면은 모델 타입/정규화 → 조회 함수 → 페이지 → 공통 컴포넌트 순서로 확장한다.

### `app/api/health/supabase/route.ts`

Supabase 환경변수와 연결 가능 여부를 확인하는 GET API Route다. 서버 Supabase 클라이언트를 만들고 간단한 조회를 수행해 상태와 오류를 JSON으로 반환한다. 배포·로컬 환경에서 `.env.local` 설정과 데이터 API 노출/권한 문제를 빠르게 확인하는 용도다.

### `app/globals.css`

Tailwind나 CSS Modules 없이 사용하는 전역 스타일 파일이다. 앱 셸, 분석 레이아웃, 카드·지표·배지·버튼·표·폼·반응형 레이아웃 등 모든 화면의 시각 체계를 정의한다. 컴포넌트는 여기에 정의된 클래스를 조합해 사용하며 새 스타일이 필요할 때도 우선 이 파일에 추가한다.

## 5. `components/` 상세

### `components/procurement-app.tsx`

홈 업무 흐름의 최상위 클라이언트 컴포넌트다. `useState`로 현재 단계와 시작 여부를 관리하고, `StepId` 타입으로 단계 전환을 제한한다.

주요 책임:

- 앱 셸·사이드바·상단바·본문 구성
- 단계 목록과 진행 상태 표시
- 현재 단계에 맞는 `DashboardStep`, `DemandStep`, `SupplyStep`, `MasterStep`, `CalculationStep`, `ReportStep` 렌더링
- 단계 이동 콜백 전달

이 컴포넌트는 업무 흐름 조정자이며, 실제 계산·DB 저장을 수행하는 계층이 아니다.

### `components/analysis/analysis-frame.tsx`

분석 페이지의 공통 제목 영역과 본문 컨테이너를 제공한다. 분석 페이지가 제목·설명·콘텐츠 배치를 반복하지 않도록 하는 얇은 프레임 컴포넌트다.

### `components/analysis/analysis-tabs.tsx`

분석 라우트 목록을 정의하고 현재 경로에 맞춰 탭 링크를 렌더링한다. 분석 메뉴를 추가할 때 `app/analysis/layout.tsx` 대신 이 파일의 탭 구성을 수정한다.

### `components/analysis/data-table.tsx`

분석 데이터용 제네릭 테이블이다. 컬럼 키·라벨·정렬·선택적 셀 렌더러를 받아 헤더와 행을 생성한다. 숫자 표시를 위한 `formatNumber`도 제공해 단위와 소수점 처리를 화면마다 반복하지 않게 한다.

### `components/workflow/step-frame.tsx`

업무 단계 화면 하단의 이전/다음 버튼과 프로토타입 안내 문구를 공통으로 제공한다. 각 단계는 `onNext`, `onBack`, 선택적 `nextLabel`을 받아 단계별 화면 내용만 구현한다.

### `components/workflow/dashboard-step.tsx`

업무 흐름의 시작 화면이다. 발주계획 상태, 주요 KPI, 예외 개요, 새 계획 시작·단계 열기 동작을 샘플값으로 보여준다. `StepId`를 사용해 특정 단계로 이동할 수 있다.

### `components/workflow/demand-step.tsx`

수요 입력·검증·확정 프로토타입이다. OL, SFDC Pipeline, Bulk-deal, 실적 Trend, 수급회의 탭을 제공하고 React state로 행 편집·행 추가·대상월 변경·검증 상태·확정 상태를 관리한다.

현재 화면 안에서 OL 합계, 확률 가중 SFDC 수요, Bulk-deal 반영 수량을 계산해 미리보기로 표시한다. 이 계산은 데모용 클라이언트 상태 계산이며, 실제 업무 적용 시에는 서버/DB 계산 모델과 저장 로직으로 이동해야 한다. Excel/CSV 업로드와 저장 버튼은 현재 비활성 또는 시각적 프로토타입이다.

### `components/workflow/supply-step.tsx`

재고 상태와 Open PO 입고 가능성을 확인하는 프로토타입이다. 정상 가용 재고만 반영하고 품질 보류·불용 재고를 제외하는 업무 규칙을 설명하며, 일부 PO의 가용·위험·후속월 상태를 샘플 테이블로 표시한다.

### `components/workflow/master-step.tsx`

계산 전 마스터 준비 상태를 보여주는 프로토타입이다. 품목·기종, BOM·Common품, 장착율·사용량, MOQ·발주단위, Lead Time, Flexibility Rule을 카드와 체크리스트로 표현한다. Supplier별 Lead Time은 입력 필요 상태로 표시하고, 직접 입력·Excel/CSV 업로드는 다음 단계 기능으로 안내한다.

### `components/workflow/calculation-step.tsx`

기기·옵션·부품·소모품 발주량 계산 결과와 Flexibility, MOQ, 납기·재고 예외를 보여주는 프로토타입이다. 계산 실행 및 결과 확정의 UX 골격을 제공하지만 실제 계산 서비스나 DB 결과 저장은 연결되어 있지 않다.

### `components/workflow/report-step.tsx`

사장 보고자료의 요약 지표, 전월 대비 금액 표, 보고서 미리보기, Excel/PDF 출력 영역을 보여준다. 현재 수치는 샘플값이며 다운로드 버튼은 Phase 2 기능으로 비활성화되어 있다.

## 6. `lib/` 상세

### `lib/scm-model.ts`

분석 화면이 사용하는 도메인 모델과 정규화 함수를 둔다. 현재 `LeadtimeGap` 타입과 `normalizeLeadtimeGap`이 구현되어 있다.

- 공급처·국가·마스터 리드타임·표본수·실적평균·P80·격차를 화면 모델로 정의한다.
- `value`가 여러 컬럼 후보를 순서대로 확인한다.
- `numberValue`가 숫자 변환 실패를 `null`로 처리한다.
- 영문·한글·기존 별칭 컬럼을 함께 지원하고, 공급처·국가가 없으면 `미정`, 표본수가 없으면 `0`을 사용한다.

새 분석 기능의 타입과 DB 행 정규화는 이 파일에서 시작한다. 계산 불가 상태는 임의의 큰 숫자로 대체하지 않고 `null`과 사유 코드를 유지한다.

### `lib/scm.ts`

화면에서 사용할 SCM 데이터 조회 함수의 집합이다. 페이지가 Supabase SDK나 스키마 이름을 직접 알지 않도록 조회 책임을 이 파일에 모은다.

- `getLeadtimeGap`: `analytics.v_leadtime_gap`을 조회하고 `normalizeLeadtimeGap`으로 변환한다.
- `getStockoutKpi`: `analytics.v_stockout_kpi`에서 요약 한 행을 조회한다.
- Supabase 오류와 예외를 `{ rows/data, error }` 형태로 반환해 페이지가 조회 실패와 빈 결과를 구분할 수 있게 한다.

현재 데이터 조회 함수는 분석 영역 중심이다. 수요·재고·발주계산·보고서 조회/저장 함수는 아직 추가되지 않았다.

### `lib/supabase.ts`

Supabase 클라이언트와 환경변수 모듈을 외부에서 가져오기 위한 배럴 파일이다. `client`, `server`, `env` 구현을 하나의 import 경로로 노출한다.

### `lib/supabase/env.ts`

`NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 읽고 검증한다. 선택적 조회 함수 `getSupabaseEnv`는 없으면 `null`을 반환하고, 필수 함수 `requireSupabaseEnv`는 안내 메시지와 함께 예외를 발생시킨다. secret 키는 다루지 않는다.

### `lib/supabase/client.ts`

브라우저 컴포넌트용 Supabase 클라이언트를 만든다. publishable key를 사용하며, 필요한 환경변수가 없으면 `requireSupabaseEnv`를 통해 실패한다.

### `lib/supabase/server.ts`

서버 컴포넌트·서버 조회 함수용 Supabase 클라이언트를 만든다. 현재는 세션을 사용하지 않는 읽기 중심 구조이므로 `persistSession`과 `autoRefreshToken`을 끈다. `lib/scm.ts`가 이 클라이언트를 사용한다.

### `lib/scm-model.test.ts`

Node의 내장 `node:test`와 `assert`를 사용하는 정규화 단위 테스트다. 실제 analytics 컬럼명, 한글 별칭, 안전한 기본값을 각각 검증해 뷰 컬럼명 변화에 대한 호환성을 보장한다.

## 7. 데이터베이스와 SQL 구조

### `supabase/migrations/20260813000100_create_procurement_demand_core.sql`

Supabase CLI로 적용하는 최초 핵심 마이그레이션이다. `public` 스키마에 다음 수요확정 테이블을 만든다.

- `planning_runs`: 발주계획과 상태 전이(`draft`부터 `reported`까지)
- `ol_demand`: 부서별 OL 수요
- `sfdc_pipeline`: SFDC 딜과 수주확률
- `bulk_deals`: Bulk-deal 수요와 반영률·사전재고 여부
- `historical_actuals`: 과거 실적
- `demand_confirmations`: 수급회의 결과와 확정수요

외래키·수량/확률 CHECK 제약·계획 ID 인덱스·`updated_at` 자동 갱신 트리거를 함께 정의한다. 다만 현재 화면은 이 테이블을 조회하거나 저장하지 않는다.

### `sql/01-grants.sql`

Supabase API 역할(`anon`, `authenticated`)에 `core`, `analytics` 스키마 사용 권한과 조회 권한을 부여한다. 앞으로 생성되는 뷰에도 기본 SELECT 권한을 부여하며, 원본 `raw` 스키마는 의도적으로 공개하지 않는다.

### `sql/02-policies.sql`

수업용으로 `core.leadtime_plan`, `core.usage_profile`에 SELECT/INSERT/UPDATE/DELETE 권한과 전체 허용 RLS 정책을 부여한다. publishable key를 가진 사용자가 값을 바꿀 수 있는 정책이므로 운영 환경에서는 `auth.uid()` 기반 조건으로 좁혀야 한다.

### `dump.sql`

Supabase 원본·정제·분석 구조와 샘플 데이터가 포함된 대규모 SQL 덤프다. 프로젝트 규칙상 `raw`는 원본 보관 영역, `core`는 정제·기준 영역, `analytics`는 화면 조회용 뷰 영역으로 사용한다. 애플리케이션이 이 파일을 런타임에 읽지는 않는다.

## 8. 루트 파일과 보조 폴더

### 설정·실행 파일

- `package.json`: Next.js/React/TypeScript/Supabase 의존성과 `dev`, `build`, `start`, `test` 스크립트를 정의한다.
- `package-lock.json`: npm 의존성 잠금 파일이다.
- `next.config.ts`: React Strict Mode를 활성화한다.
- `tsconfig.json`: strict TypeScript, bundler 해석, `@/*` 경로 별칭, Next 플러그인을 설정한다.
- `vercel.json`: Vercel에서 Next.js 프레임워크로 배포하도록 지정한다.
- `next-env.d.ts`: Next.js 타입 환경 선언 파일이다.
- `.env.example`, `.env.local.example`: Supabase 환경변수 입력 예시다. 실제 값은 `.env.local`에만 둔다.
- `.gitignore`: 환경변수·빌드 결과 등 커밋 제외 대상을 정의한다.

### 요구사항·설명 문서

- `README.md`: 실행 방법, 현재 Phase 1 범위, Supabase 연결·마이그레이션 방법, 다음 구현 단계를 안내한다.
- `AGENTS.md`: 구현 규칙이다. 특히 분석 화면 계층, `analytics` 우선 조회, 순수 CSS, SQL 계산, 오류/빈 결과 구분, 변경 후 빌드를 요구한다.
- `SCHEMA.md`: Supabase 스키마 역할, 기대 행 수, analytics 뷰 컬럼, core 뷰, raw 테이블과 접속 방법을 정의하는 기준 문서다.
- `2026-08-13-procurement-planning-mvp-prd.md`: 월간 수요확정·발주계획의 제품 요구사항, 계산 규칙, 데이터 모델, 향후 전환 계획을 설명한다.
- `적용방법.md`: 수업용 준비 커밋과 Supabase 설정을 적용하는 절차를 설명한다.
- `ARCHITECTURE.md`: 현재 문서이며 저장소 구조와 런타임 흐름을 설명한다.

### `docs/`

실습 운영 문서와 계획 문서다.

- `docs/04-실습안내.md`: 4회차 실습의 목표, 시작 전 확인, 오전·오후 산출물, 현재 화면을 안내한다.
- `docs/superpowers/04-실습안내.md`: Supabase 연결, 스키마 노출, 데이터 흐름, 정규화 모델을 포함한 확장 실습 안내다.
- `docs/superpowers/plans/2026-08-13-procurement-planning-mvp-plan.md`: 로컬 웹 앱 scaffold, 흐름·내비게이션, 단계 화면, 시각 QA를 나눈 구현 계획이다.
- `docs/superpowers/specs/2026-08-13-procurement-planning-mvp-prd.md`: 루트 PRD의 문서화 사본이다.

### `outputs/`

프로세스 정의서 생성 결과를 보관한다. Excel 원본, 검사 결과 `.ndjson`, 각 시트의 PNG 미리보기가 들어 있다. 런타임 애플리케이션이 직접 참조하는 소스 폴더가 아니라 문서·검수 산출물 폴더다.

### 루트의 `.docx` 임시 파일

`~$차 강의안_수정.docx`는 Microsoft Office가 만드는 임시 잠금 파일로 보인다. 애플리케이션 실행 경로와 무관하며 문서 소스로 사용하지 않는다.

## 9. 데이터 생성 스크립트

### `build_workbook.mjs`

`@oai/artifact-tool`로 프로세스 정의서용 Excel 통합문서를 생성한다. 사용안내, 프로세스맵, 상세프로세스, 계산규칙, 데이터정의, RACI, KPI, 발주계산템플릿, 시스템 구축 입력사항, 샘플자료 체크, 정책결정표, FXLIVE 연계정의 시트를 만든다. 생성 후 특정 범위 검사와 수식 오류 검색·렌더링 검증을 수행한다.

### `build_dummy_demand_data.mjs`

수요확정 화면과 실습에 사용할 OL, SFDC, Bulk-deal, 실적 Trend, 수급회의 확정수요, 월별 요약 더미 데이터를 Excel로 생성한다. 생성 후 표 검사와 `#REF!`, `#DIV/0!`, `#VALUE!` 등의 수식 오류 검색을 수행한다.

두 스크립트 모두 현재 `package.json`의 npm script에는 등록되어 있지 않고, 생성 경로가 작성 당시의 로컬 절대경로를 포함하므로 다른 환경에서 실행하기 전 출력 경로를 확인해야 한다.

## 10. 개발·검증 규칙

```bash
npm run dev       # 로컬 개발 서버
npm run test      # lib/**/*.test.ts 단위 테스트
npm run build     # Next.js 프로덕션 빌드
```

기능을 추가할 때는 다음 순서를 유지한다.

1. `lib/scm-model.ts`에 타입·컬럼 정규화 함수를 추가한다.
2. `lib/scm.ts`에 `core`/`analytics` 조회 함수를 추가한다.
3. `app/analysis/<이름>/page.tsx`에 서버 화면을 추가한다.
4. `components/analysis/*`의 공통 프레임·테이블을 재사용한다.

검증 시에는 DB 조회 오류와 빈 배열을 분리해 표시하고, 화면에서 평균·분위수 같은 집계 계산을 새로 만들지 않는다. Supabase 조회가 빈 배열이면 데이터 부재뿐 아니라 API의 Exposed schemas 설정과 스키마 권한도 확인한다.

## 11. 확장 시 권장 경계

향후 PRD 기능을 실제로 연결할 때는 현재 컴포넌트에 저장·계산 코드를 직접 넣지 말고 다음 경계를 유지하는 것이 적합하다.

```text
페이지/컴포넌트
  → 화면 이벤트·입력 검증
  → 업무 서비스(수요확정, 공급 준비, 발주계산, 보고서)
  → 조회/저장 Repository 또는 lib/scm.ts
  → Supabase core/analytics 및 planning 테이블
```

특히 확정 리드타임·사용 프로파일 변경은 `core` 테이블에 저장하고, `analytics.v_stockout_risk` 같은 뷰가 이를 반영하도록 해야 한다. 화면 코드에 기준값을 복사하면 분석 화면과 발주계산 화면 사이에 숫자 불일치가 생긴다. 운영 전환 시에는 수업용 전체 허용 RLS를 제거하고 인증·사용자별 권한·변경 이력을 추가해야 한다.
