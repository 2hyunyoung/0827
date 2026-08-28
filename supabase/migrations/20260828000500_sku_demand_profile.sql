-- STEP5 SKU Demand Profile
-- 원천은 반드시 core.v_train_demand이며 test view/raw 테이블을 참조하지 않습니다.

create or replace view analytics.v_sku_demand_profile as
with setting as (
  select train_start, train_end
  from core.forecast_setting
  where setting_key = 'default'
), periods as (
  select row_number() over (order by period_start)::integer as period_no,
         period_start::date as period_start
  from setting,
       generate_series(
         date_trunc('month', train_start::timestamp),
         date_trunc('month', train_end::timestamp),
         interval '1 month'
       ) as generated(period_start)
  where train_start is not null and train_end is not null
), items as (
  select item_id, max(item_name) as item_name
  from core.v_item_master
  group by item_id
), monthly_train as (
  select upper(regexp_replace(item_id, '[\s\-_]', '', 'g')) as item_id,
         date_trunc('month', use_date)::date as period_start,
         sum(qty) as quantity,
         count(*)::integer as source_row_count
  from core.v_train_demand
  group by 1, 2
), grid as (
  select i.item_id, i.item_name, p.period_no, p.period_start,
         case when mt.source_row_count is null then 0::numeric else mt.quantity end as quantity,
         coalesce(mt.source_row_count, 0) as source_row_count
  from items i
  cross join periods p
  left join monthly_train mt on mt.item_id = i.item_id and mt.period_start = p.period_start
), stats as (
  select item_id, max(item_name) as item_name,
         count(*)::integer as n_periods,
         count(*) filter (where quantity > 0)::integer as n_nonzero_periods,
         sum(case when quantity = 0 then 1 else 0 end)::integer as n_zero_periods,
         sum(case when source_row_count = 0 then 1 else 0 end)::integer as n_no_source_periods,
         avg(quantity) filter (where quantity > 0) as nonzero_mean,
         stddev_samp(quantity) filter (where quantity > 0) as nonzero_sd,
         regr_slope(quantity, period_no) filter (where quantity is not null) as trend,
         max(quantity) as peak_quantity
  from grid
  group by item_id
), ranked_periods as (
  select g.*, row_number() over (partition by item_id order by quantity desc, period_start asc) as peak_rank
  from grid g
), peaks as (
  select item_id, period_start as peak_period
  from ranked_periods
  where peak_rank = 1
), recent as (
  select item_id,
         avg(quantity) filter (where period_no > n_periods - 3) as recent_mean,
         avg(quantity) filter (where period_no > n_periods - 6 and period_no <= n_periods - 3) as prior_mean
  from grid join (select item_id, max(period_no) as n_periods from grid group by item_id) using (item_id)
  group by item_id
), month_effect as (
  select item_id,
         count(distinct calendar_month) as month_count,
         max(month_mean) - min(month_mean) as month_mean_range
  from (
    select item_id, extract(month from period_start) as calendar_month, avg(quantity) as month_mean
    from grid
    group by item_id, extract(month from period_start)
  ) grouped_months
  group by item_id
)
select s.item_id,
       s.item_name,
       s.n_periods,
       s.n_nonzero_periods,
       case when s.n_nonzero_periods > 0 then s.n_periods::numeric / s.n_nonzero_periods else null end as adi,
       case when s.nonzero_mean > 0 and s.n_nonzero_periods >= 2 then s.nonzero_sd / s.nonzero_mean else null end as cv,
       case when s.nonzero_mean > 0 and s.n_nonzero_periods >= 2 then power(s.nonzero_sd / s.nonzero_mean, 2) else null end as cv_squared,
       case when s.n_periods > 0 then s.n_zero_periods::numeric / s.n_periods else null end as zero_demand_rate,
       s.trend,
       case when r.prior_mean is not null and r.prior_mean <> 0 then (r.recent_mean - r.prior_mean) / abs(r.prior_mean) else null end as recent_change_rate,
       p.peak_period,
       case
         when s.n_nonzero_periods = 0 then null
         when s.n_nonzero_periods < 2 or s.nonzero_mean is null or s.nonzero_mean = 0 then null
         when s.n_periods::numeric / s.n_nonzero_periods < 1.32 and power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'SMOOTH'
         when s.n_periods::numeric / s.n_nonzero_periods >= 1.32 and power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'INTERMITTENT'
         when s.n_periods::numeric / s.n_nonzero_periods < 1.32 and power(s.nonzero_sd / s.nonzero_mean, 2) >= 0.49 then 'ERRATIC'
         else 'LUMPY'
       end as demand_type,
       case when s.n_periods >= 24 then (me.month_mean_range > 0 and me.month_count >= 2) else null end as seasonality,
       case
         when s.n_nonzero_periods = 0 then 'NO_DEMAND'
         when s.n_nonzero_periods < 2 or s.nonzero_mean is null or s.nonzero_mean = 0 then 'INSUFFICIENT_NONZERO_PERIODS'
         when s.n_periods < 2 then 'INSUFFICIENT_TREND_PERIODS'
         when s.n_periods < 24 then 'INSUFFICIENT_PERIODS'
         else null
       end as reason_code,
       case
         when s.n_nonzero_periods < 2 or s.nonzero_mean is null or s.nonzero_mean = 0 then null
         when power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'STABLE'
         else 'VARIABLE'
       end as stability
from stats s
left join peaks p using (item_id)
left join recent r using (item_id)
left join month_effect me using (item_id);

create or replace view analytics.v_demand_profile_kpi as
select count(*)::integer as total_items,
       count(*) filter (where demand_type = 'SMOOTH')::integer as n_smooth,
       count(*) filter (where demand_type = 'INTERMITTENT')::integer as n_intermittent,
       count(*) filter (where demand_type = 'ERRATIC')::integer as n_erratic,
       count(*) filter (where demand_type = 'LUMPY')::integer as n_lumpy,
       count(*) filter (where demand_type in ('INTERMITTENT', 'LUMPY'))::integer as n_croston_needed,
       count(*) filter (where demand_type is null)::integer as n_calculation_unavailable
from analytics.v_sku_demand_profile;

grant select on analytics.v_sku_demand_profile, analytics.v_demand_profile_kpi to authenticated;
revoke all on analytics.v_sku_demand_profile, analytics.v_demand_profile_kpi from anon;
