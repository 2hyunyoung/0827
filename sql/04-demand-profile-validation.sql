-- STEP5 Demand Profile 검증 쿼리

-- 전체 프로파일과 KPI
select * from analytics.v_sku_demand_profile order by item_id;
select * from analytics.v_demand_profile_kpi;

-- Demand Profile의 원천이 train view인지 확인할 때 사용하는 기간 경계 검증
select count(*) as profile_rows_outside_train
from analytics.v_sku_demand_profile profile
cross join core.forecast_setting setting
where setting.setting_key = 'default'
  and (profile.n_periods < 0 or setting.train_start is null or setting.train_end is null);

-- train view가 test 기간으로 넘어가는지 확인
select count(*) as train_rows_in_test_window
from core.v_train_demand train_data
cross join core.forecast_setting setting
where setting.setting_key = 'default'
  and setting.test_start is not null
  and train_data.use_date >= setting.test_start;

-- Grid가 학습기간의 월 개수와 맞는지 확인
select item_id, n_periods
from analytics.v_sku_demand_profile
where n_periods <> (
  select count(*)
  from generate_series(
    date_trunc('month', (select train_start::timestamp from core.forecast_setting where setting_key = 'default')),
    date_trunc('month', (select train_end::timestamp from core.forecast_setting where setting_key = 'default')),
    interval '1 month'
  )
);
