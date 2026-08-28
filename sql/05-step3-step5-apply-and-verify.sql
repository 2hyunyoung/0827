/*
  STEP 3~5 Supabase 적용·검증 가이드

  SQL Editor에서 아래 migration 파일을 파일별로, 표시된 순서대로 실행하세요.
  이 파일 자체는 이미 생성된 객체의 권한 보정과 적용 결과 검증을 수행합니다.

  1) supabase/migrations/20260828000300_forecast_data_isolation.sql
  2) supabase/migrations/20260828000400_import_pipeline.sql
  3) supabase/migrations/20260828000500_sku_demand_profile.sql

  STEP 2 인증 migration이 아직 적용되지 않았다면 먼저 실행하세요.
  supabase/migrations/20260828000200_auth_rbac.sql
*/

-- API Data API에서 사용할 스키마 권한
grant usage on schema core, analytics, raw to authenticated;
revoke all on schema raw from anon;

-- 업무 원본은 브라우저/anon에서 조회할 수 없습니다.
revoke all on all tables in schema raw from anon;
revoke select on all tables in schema raw from authenticated;

-- 화면과 관리 기능은 필요한 view/table만 사용합니다.
grant select on analytics.v_data_coverage,
  analytics.v_forecast_settings,
  analytics.v_import_history,
  analytics.v_sku_demand_profile,
  analytics.v_demand_profile_kpi
to authenticated;

grant select on core.v_train_demand, core.v_test_actual to authenticated;

-- 적용 객체 확인
select table_schema, table_name
from information_schema.tables
where (table_schema, table_name) in (
  ('raw', 'business_event'),
  ('raw', 'sales_order'),
  ('raw', 'item_substitute'),
  ('core', 'policy_config'),
  ('core', 'outlier_rule'),
  ('core', 'item_policy'),
  ('core', 'forecast_setting'),
  ('core', 'upload_batch'),
  ('core', 'import_staging'),
  ('core', 'validation_error')
)
order by table_schema, table_name;

-- RAW 적재 추적 컬럼 확인
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'raw'
  and column_name in ('batch_id', 'source_type', 'loaded_at', 'source_record_id')
order by table_name, column_name;

-- 화면용 view 확인
select table_schema, table_name
from information_schema.views
where (table_schema, table_name) in (
  ('core', 'v_train_demand'),
  ('core', 'v_test_actual'),
  ('analytics', 'v_data_coverage'),
  ('analytics', 'v_forecast_settings'),
  ('analytics', 'v_import_history'),
  ('analytics', 'v_sku_demand_profile'),
  ('analytics', 'v_demand_profile_kpi')
)
order by table_schema, table_name;

-- Demand Profile 결과 및 KPI
select * from analytics.v_demand_profile_kpi;
select item_id, item_name, n_periods, n_nonzero_periods,
       adi, cv_squared, zero_demand_rate, trend,
       recent_change_rate, peak_period, demand_type,
       seasonality, reason_code, stability
from analytics.v_sku_demand_profile
order by item_id;

-- train profile이 test 기간을 사용하지 않는지 확인
select count(*) as train_rows_in_test_window
from core.v_train_demand train_data
cross join core.forecast_setting setting
where setting.setting_key = 'default'
  and setting.test_start is not null
  and train_data.use_date >= setting.test_start;

-- train/test 경계가 겹치지 않는지 확인
select count(*) as overlapping_train_test_rows
from core.v_train_demand train_data
join core.v_test_actual test_data
  on train_data.usage_id = test_data.usage_id;

-- 계산 불가 SKU는 숫자 대체 없이 reason_code를 가져야 함
select count(*) as unavailable_without_reason
from analytics.v_sku_demand_profile
where demand_type is null
  and coalesce(reason_code, '') = '';

-- anon 권한 점검: 모두 false가 정상
select
  has_schema_privilege('anon', 'raw', 'usage') as anon_raw_schema_usage,
  has_table_privilege('anon', 'raw.usage_history', 'select') as anon_raw_select,
  has_table_privilege('anon', 'raw.usage_history', 'insert') as anon_raw_insert,
  has_table_privilege('anon', 'analytics.v_sku_demand_profile', 'select') as anon_profile_select;

-- authenticated 화면 권한 점검
select
  has_table_privilege('authenticated', 'analytics.v_sku_demand_profile', 'select') as authenticated_profile_select,
  has_table_privilege('authenticated', 'analytics.v_demand_profile_kpi', 'select') as authenticated_kpi_select;
