-- STEP10 Safety Stock + Purchase Recommendation
-- Bias: forecast - actual. Forecast error sigma는 STEP6/7 저장 결과를 사용합니다.

create or replace view analytics.v_safety_stock as
with policy as (
  select (select max(safety_buffer_days) from core.policy_config where active) safety_buffer_days,
    (select config_value->'z_value_by_grade' from core.policy_config where config_key='service_level_z' and active order by updated_at desc limit 1) z_by_grade
), item_base as (
  select i.item_id,i.item_name,i.supplier_id,ip.item_grade,coalesce(ip.service_level, pc.service_level) service_level,
    case when ip.item_grade is null or p.z_by_grade is null then null else (p.z_by_grade->>ip.item_grade)::numeric end z_value,
    le.effective_lead_time,st.p80_days,st.std_days,st.p50_days,st.p90_days
  from core.v_item_master i left join core.item_policy ip using(item_id)
  left join lateral (select service_level from core.policy_config where config_key='default' and active limit 1) pc on true
  left join core.v_leadtime_effective le on le.supplier_id=i.supplier_id left join core.v_leadtime_stat st on st.supplier_id=i.supplier_id cross join policy p where i.is_active='Y'
), champion_error as (
  select distinct on (c.item_id) c.item_id,r.run_id,r.model_id,r.model_version,r.p50 forecast_qty,r.sigma,r.period
  from core.champion_model c join core.forecast_result r on r.item_id=c.item_id and r.model_id=c.champion_model_id and r.run_id=c.backtest_run_id
  where r.calculation_status='SUCCESS' and r.period >= date_trunc('month',current_date)::date order by c.item_id,r.period,c.selected_at desc
), demand as (
  select i.item_id,coalesce(f.forecast_qty, null) forecast_qty,f.sigma,f.run_id forecast_run_id,f.model_version,
    i.item_name,i.item_grade,i.service_level,i.z_value,i.effective_lead_time,i.std_days,i.p80_days,i.p50_days,i.p90_days,
    p.safety_buffer_days
  from item_base i left join champion_error f using(item_id) cross join policy p
)
select item_id,item_name,item_grade,forecast_qty,sigma forecast_error_sigma,effective_lead_time,std_days leadtime_sigma,p80_days,p50_days,p90_days,service_level,z_value,
  case when effective_lead_time is not null and sigma is not null and forecast_qty is not null and z_value is not null then z_value * sqrt((effective_lead_time/30.0)*power(sigma,2) + power(forecast_qty,2)*power(coalesce(std_days,0)/30.0,2)) end safety_stock,
  forecast_run_id,model_version,safety_buffer_days,
  case when forecast_qty is null then 'NO_FORECAST' when effective_lead_time is null then 'NO_LEADTIME' when sigma is null then 'INSUFFICIENT_FORECAST_ERROR' when z_value is null then 'NO_SERVICE_LEVEL' when std_days is null then 'INSUFFICIENT_SAMPLE' end reason_code
from demand;

create or replace view analytics.purchase_recommendation as
with first_projection as (
  select distinct on(item_id) item_id,period,beginning_inventory,scheduled_receipts,confirmed_sales_order,soft_allocation,forecast_demand,ending_projected_inventory,stockout_period
  from core.v_projection_inventory order by item_id, case when forecast_demand is null then 1 else 0 end, period
), safety as (select * from analytics.v_safety_stock), stockout as (select item_id,stockout_date,risk_status from analytics.v_stockout_risk),
base as (
  select s.item_id,s.item_name,s.item_grade,s.forecast_qty,s.forecast_run_id,s.model_version,s.safety_stock,s.effective_lead_time,s.safety_buffer_days,
    fp.beginning_inventory available_inventory,fp.scheduled_receipts,fp.confirmed_sales_order,fp.soft_allocation,
    greatest(coalesce(s.forecast_qty,0),coalesce(fp.confirmed_sales_order,0)) demand_basis_qty,
    ip.moq,ip.pack_size,st.stockout_date,st.risk_status,s.reason_code safety_reason_code
  from safety s left join first_projection fp using(item_id) left join core.item_policy ip using(item_id) left join stockout st using(item_id)
), requirements as (
  select b.*,case when b.safety_reason_code is not null or b.available_inventory is null then null else b.demand_basis_qty + b.safety_stock - b.available_inventory - b.scheduled_receipts end required_qty,
    case when b.safety_reason_code is not null then b.safety_reason_code when b.available_inventory is null then 'NO_INVENTORY_DATA' end calculation_reason
  from base b
), rounded as (
  select r.*,case when r.required_qty is null then null when r.required_qty <= 0 then 0 when r.moq is null and r.pack_size is null then r.required_qty else ceil(greatest(r.required_qty,coalesce(r.moq,0))/coalesce(nullif(r.pack_size,0),1))*coalesce(nullif(r.pack_size,0),1) end recommended_qty
  from requirements r
)
select item_id,item_name,item_grade,forecast_qty,confirmed_sales_order demand_basis_confirmed_qty,demand_basis_qty,available_inventory,scheduled_receipts,safety_stock,effective_lead_time effective_leadtime,effective_lead_time stockout_leadtime,stockout_date,safety_buffer_days,required_qty,moq,pack_size,recommended_qty,
  case when stockout_date is null or effective_lead_time is null or safety_buffer_days is null then null else stockout_date - effective_lead_time - safety_buffer_days end recommended_order_date,
  case when safety_reason_code is not null then 'CALCULATION_UNAVAILABLE' when required_qty <= 0 then 'NO_ORDER_REQUIRED' when stockout_date is null then 'SAFE' else risk_status end risk_status,
  case when calculation_reason is not null then 'CALCULATION_UNAVAILABLE' else 'CALCULATED' end calculation_status,
  case when calculation_reason is not null then calculation_reason when required_qty <= 0 then 'NO_ORDER_REQUIRED' when moq is null and pack_size is null then 'NO_ITEM_POLICY' end reason_code,
  forecast_run_id,model_version,
  jsonb_build_object('demand_basis_qty',demand_basis_qty,'safety_stock',safety_stock,'available_inventory',available_inventory,'scheduled_receipts',scheduled_receipts,'confirmed_sales_order',confirmed_sales_order,'soft_allocation',soft_allocation,'required_qty',required_qty,'moq',moq,'pack_size',pack_size,'recommended_qty',recommended_qty) calculation_trace
from rounded;

alter table core.leadtime_policy_history enable row level security;
grant select on analytics.v_safety_stock,analytics.purchase_recommendation to authenticated;
revoke all on analytics.v_safety_stock,analytics.purchase_recommendation from anon;
