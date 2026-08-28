-- STEP8 Python 서비스 모델 등록
alter table core.model_config drop constraint if exists model_config_engine_check;
alter table core.model_config add constraint model_config_engine_check check (engine in ('SQL_BASELINE','PYTHON_SERVICE'));
alter table core.model_config drop constraint if exists model_config_family_check;
alter table core.model_config add constraint model_config_family_check check (family in ('MOVING_AVERAGE','WEIGHTED_MOVING_AVERAGE','SEASONAL_NAIVE','EXPONENTIAL_SMOOTHING','INTERMITTENT_DEMAND','SARIMA','PROPHET','ML'));
insert into core.model_config(model_id,model_name,family,engine,version,enabled,is_default,applicable_demand_type,parameters,description)
values
 ('PY_MA_3M','Python 3개월 이동평균','MOVING_AVERAGE','PYTHON_SERVICE','1.0.0',true,false,array['SMOOTH','ERRATIC','INTERMITTENT','LUMPY'],'{"window":3}','Python Forecast Service'),
 ('PY_EXPSMOOTH','Exponential Smoothing','EXPONENTIAL_SMOOTHING','PYTHON_SERVICE','1.0.0',true,false,array['SMOOTH','ERRATIC'],'{}','statsmodels 기반 지수평활'),
 ('PY_HOLT_WINTERS','Holt-Winters','EXPONENTIAL_SMOOTHING','PYTHON_SERVICE','1.0.0',true,false,array['SMOOTH','ERRATIC'],'{"seasonal_periods":12}','statsmodels 기반 Holt-Winters'),
 ('PY_SEASONAL_NAIVE','Python 계절 순진 예측','SEASONAL_NAIVE','PYTHON_SERVICE','1.0.0',true,false,array['SMOOTH','ERRATIC','INTERMITTENT','LUMPY'],'{"season_months":12}','학습 데이터 기반 계절 순진 예측'),
 ('PY_CROSTON','Croston','INTERMITTENT_DEMAND','PYTHON_SERVICE','1.0.0',true,false,array['INTERMITTENT','LUMPY'],'{}','간헐수요 모델'),
 ('PY_SBA','SBA','INTERMITTENT_DEMAND','PYTHON_SERVICE','1.0.0',true,false,array['INTERMITTENT','LUMPY'],'{"alpha":0.1}','간헐수요 편향 보정'),
 ('PY_TSB','TSB','INTERMITTENT_DEMAND','PYTHON_SERVICE','1.0.0',true,false,array['INTERMITTENT','LUMPY'],'{}','간헐수요 수요확률 모델'),
 ('PY_SARIMA','SARIMA','SARIMA','PYTHON_SERVICE','1.0.0',false,false,array['SMOOTH','ERRATIC'],'{}','선택적 statsmodels 확장'),
 ('PY_PROPHET','Prophet','PROPHET','PYTHON_SERVICE','1.0.0',false,false,array['SMOOTH','ERRATIC','INTERMITTENT','LUMPY'],'{}','선택적 Prophet 확장'),
 ('PY_XGBOOST','XGBoost','ML','PYTHON_SERVICE','1.0.0',false,false,array['SMOOTH','ERRATIC','INTERMITTENT','LUMPY'],'{}','선택적 XGBoost 확장')
on conflict (model_id) do nothing;
