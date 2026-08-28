-- STEP3 학습/검증 데이터 격리 확인용 조회입니다.

select * from analytics.v_data_coverage;

select count(*) as leakage_rows
from core.v_train_demand train
join core.forecast_setting setting on setting.setting_key = 'default'
where setting.test_start is not null
  and train.use_date >= setting.test_start;

select count(*) as train_outside_rows
from core.v_train_demand train
join core.forecast_setting setting on setting.setting_key = 'default'
where train.use_date < setting.train_start
   or train.use_date > setting.train_end;

select count(*) as test_outside_rows
from core.v_test_actual test_data
join core.forecast_setting setting on setting.setting_key = 'default'
where test_data.use_date < setting.test_start
   or test_data.use_date > setting.test_end;

select
  has_table_privilege('anon', 'raw.usage_history', 'select') as anon_raw_select,
  has_table_privilege('anon', 'core.policy_config', 'insert') as anon_policy_insert,
  has_table_privilege('authenticated', 'analytics.v_data_coverage', 'select') as authenticated_coverage_select;
