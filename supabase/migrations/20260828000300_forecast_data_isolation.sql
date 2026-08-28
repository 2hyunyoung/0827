-- STEP3 데이터 모델 확장 및 학습/검증 데이터 격리
-- 기존 raw 테이블은 drop/recreate하지 않고 nullable 적재 추적 컬럼만 추가합니다.

create schema if not exists raw;
create schema if not exists core;
create schema if not exists analytics;

create table if not exists raw.business_event (
  business_event_id text primary key,
  event_type text not null,
  event_date date,
  item_id text,
  qty numeric,
  description text,
  batch_id uuid,
  source_type text,
  loaded_at timestamptz default now(),
  source_record_id text
);

create table if not exists raw.sales_order (
  sales_order_id text primary key,
  order_date date,
  customer_id text,
  item_id text,
  quantity numeric,
  status text,
  expected_delivery_date date,
  batch_id uuid,
  source_type text,
  loaded_at timestamptz default now(),
  source_record_id text
);

create table if not exists raw.item_substitute (
  item_substitute_id text primary key,
  item_id text not null,
  substitute_item_id text not null,
  conversion_rate numeric,
  priority integer,
  active boolean default true,
  batch_id uuid,
  source_type text,
  loaded_at timestamptz default now(),
  source_record_id text,
  unique (item_id, substitute_item_id)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'shipment_log', 'usage_history', 'inventory', 'item_master',
    'supplier_master', 'purchase_order', 'goods_receipt'
  ] loop
    execute format('alter table raw.%I add column if not exists batch_id uuid', table_name);
    execute format('alter table raw.%I add column if not exists source_type text', table_name);
    execute format('alter table raw.%I add column if not exists loaded_at timestamptz', table_name);
    execute format('alter table raw.%I alter column loaded_at set default now()', table_name);
    execute format('alter table raw.%I add column if not exists source_record_id text', table_name);
  end loop;
end $$;

create table if not exists core.policy_config (
  config_key text primary key,
  service_level numeric(6,5),
  review_period_days integer,
  safety_buffer_days integer,
  config_value jsonb not null default '{}'::jsonb,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_level is null or service_level >= 0 and service_level <= 1),
  check (review_period_days is null or review_period_days >= 0),
  check (safety_buffer_days is null or safety_buffer_days >= 0)
);

create table if not exists core.outlier_rule (
  rule_key text primary key,
  rule_type text not null check (rule_type in ('PROJECT', 'RETURN', 'DUPLICATE', 'OTHER')),
  description text,
  enabled boolean not null default true,
  exclude_from_training boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.item_policy (
  item_id text primary key,
  moq numeric,
  pack_size numeric,
  item_grade text,
  service_level numeric(6,5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (moq is null or moq >= 0),
  check (pack_size is null or pack_size > 0),
  check (service_level is null or service_level >= 0 and service_level <= 1)
);

create table if not exists core.forecast_setting (
  setting_key text primary key default 'default',
  train_start date,
  train_end date,
  test_start date,
  test_end date,
  granularity text not null default 'DAILY' check (granularity in ('DAILY', 'WEEKLY', 'MONTHLY')),
  updated_at timestamptz not null default now(),
  check (train_start is null or train_end is null or train_start <= train_end),
  check (test_start is null or test_end is null or test_start <= test_end),
  check (train_end is null or test_start is null or train_end < test_start)
);

insert into core.forecast_setting(setting_key)
values ('default')
on conflict (setting_key) do nothing;

create or replace view core.v_train_demand as
select
  u.usage_id,
  upper(regexp_replace(u.item_id, '[\s\-_]', '', 'g')) as item_id,
  u.use_date,
  u.qty,
  u.warehouse,
  u.note,
  u.batch_id,
  u.source_type,
  u.loaded_at,
  u.source_record_id,
  'TRAIN'::text as data_split
from raw.usage_history u
cross join core.forecast_setting s
where s.setting_key = 'default'
  and s.train_start is not null
  and s.train_end is not null
  and u.use_date between s.train_start and s.train_end;

create or replace view core.v_test_actual as
select
  u.usage_id,
  upper(regexp_replace(u.item_id, '[\s\-_]', '', 'g')) as item_id,
  u.use_date,
  u.qty,
  u.warehouse,
  u.note,
  u.batch_id,
  u.source_type,
  u.loaded_at,
  u.source_record_id,
  'TEST'::text as data_split
from raw.usage_history u
cross join core.forecast_setting s
where s.setting_key = 'default'
  and s.test_start is not null
  and s.test_end is not null
  and u.use_date between s.test_start and s.test_end;

create or replace view analytics.v_data_coverage as
with actual as (
  select min(use_date) as data_start, max(use_date) as data_end
  from raw.usage_history
), setting as (
  select * from core.forecast_setting where setting_key = 'default'
)
select
  actual.data_start,
  actual.data_end,
  setting.train_start,
  setting.train_end,
  setting.test_start,
  setting.test_end,
  (select count(*) from core.v_train_demand) as train_row_count,
  (select count(*) from core.v_test_actual) as test_row_count,
  (setting.train_start is not null and setting.train_end is not null and actual.data_start is not null and actual.data_end is not null and setting.train_start >= actual.data_start and setting.train_end <= actual.data_end and setting.train_start <= setting.train_end and setting.train_end < coalesce(setting.test_start, setting.train_end + 1)) as train_window_ok,
  (setting.test_start is not null and setting.test_end is not null and actual.data_start is not null and actual.data_end is not null and setting.test_start >= actual.data_start and setting.test_end <= actual.data_end and setting.test_start <= setting.test_end) as test_window_ok,
  setting.granularity
from actual cross join setting;

create or replace view analytics.v_forecast_settings as
select
  c.data_start,
  c.data_end,
  c.train_start,
  c.train_end,
  c.test_start,
  c.test_end,
  c.train_row_count,
  c.test_row_count,
  c.train_window_ok,
  c.test_window_ok,
  c.granularity,
  (select coalesce(jsonb_agg(to_jsonb(p) order by p.config_key), '[]'::jsonb) from core.policy_config p where p.active) as policy_values,
  (select coalesce(jsonb_agg(to_jsonb(r) order by r.rule_key), '[]'::jsonb) from core.outlier_rule r) as outlier_rules,
  (select coalesce(jsonb_agg(to_jsonb(i) order by i.item_id), '[]'::jsonb) from core.item_policy i) as item_policies
from analytics.v_data_coverage c;

alter table core.policy_config enable row level security;
alter table core.outlier_rule enable row level security;
alter table core.item_policy enable row level security;
alter table core.forecast_setting enable row level security;

drop policy if exists "forecast_policy_authenticated_select" on core.policy_config;
create policy "forecast_policy_authenticated_select" on core.policy_config for select to authenticated using (true);
drop policy if exists "forecast_policy_admin_write" on core.policy_config;
create policy "forecast_policy_admin_write" on core.policy_config for all to authenticated using (core.is_admin()) with check (core.is_admin());
drop policy if exists "outlier_rule_authenticated_select" on core.outlier_rule;
create policy "outlier_rule_authenticated_select" on core.outlier_rule for select to authenticated using (true);
drop policy if exists "outlier_rule_admin_write" on core.outlier_rule;
create policy "outlier_rule_admin_write" on core.outlier_rule for all to authenticated using (core.is_admin()) with check (core.is_admin());
drop policy if exists "item_policy_authenticated_select" on core.item_policy;
create policy "item_policy_authenticated_select" on core.item_policy for select to authenticated using (true);
drop policy if exists "item_policy_admin_write" on core.item_policy;
create policy "item_policy_admin_write" on core.item_policy for all to authenticated using (core.is_admin()) with check (core.is_admin());
drop policy if exists "forecast_setting_authenticated_select" on core.forecast_setting;
create policy "forecast_setting_authenticated_select" on core.forecast_setting for select to authenticated using (true);
drop policy if exists "forecast_setting_admin_write" on core.forecast_setting;
create policy "forecast_setting_admin_write" on core.forecast_setting for all to authenticated using (core.is_admin()) with check (core.is_admin());

revoke all on all tables in schema raw from anon, authenticated;
revoke all on core.policy_config, core.outlier_rule, core.item_policy, core.forecast_setting from anon;
grant select on core.policy_config, core.outlier_rule, core.item_policy, core.forecast_setting to authenticated;
grant insert, update, delete on core.policy_config, core.outlier_rule, core.item_policy, core.forecast_setting to authenticated;
grant select on core.v_train_demand, core.v_test_actual to authenticated;
grant select on analytics.v_data_coverage, analytics.v_forecast_settings to authenticated;
revoke all on analytics.v_data_coverage, analytics.v_forecast_settings from anon;

-- 기존 기본값 계산 뷰가 raw.usage_history를 직접 읽는 것은 유지하되,
-- 향후 Forecast/Demand Profile/Backtest 구현은 반드시 위 두 격리 뷰만 사용합니다.
