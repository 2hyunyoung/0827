-- STEP2 이후의 기본 권한입니다.
-- anon은 업무 스키마에 접근하지 않고, 로그인 사용자는 분석 결과를 조회합니다.

revoke all on schema core, analytics from anon;
revoke all on all tables in schema core from anon;
revoke all on all tables in schema analytics from anon;

grant usage on schema core, analytics to authenticated;
grant select on all tables in schema analytics to authenticated;
grant select on core.leadtime_plan, core.usage_profile to authenticated;
grant insert, update, delete on core.leadtime_plan, core.usage_profile to authenticated;

alter default privileges in schema analytics
  revoke all on tables from anon;
alter default privileges in schema analytics
  grant select on tables to authenticated;
