import { requireAdmin } from '@/lib/auth';
import { getForecastSettings } from '@/lib/scm';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';

export const dynamic = 'force-dynamic';

function DateValue({ value }: { value: string | null }) { return value ? <span>{value}</span> : <EmptyValue reason="NOT_CONFIGURED" />; }

export default async function ForecastSettingsPage() {
  await requireAdmin();
  const { data, error } = await getForecastSettings();
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Forecast 설정" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="학습·검증 설정" description="Forecast가 사용할 학습 기간과 검증 기간, 정책값을 확인합니다." />{error ? <Panel><p className="text-danger">조회에 실패했습니다: {error}</p></Panel> : !data ? <Panel><p className="muted">표시할 설정이 없습니다. analytics.v_forecast_settings를 확인하세요.</p></Panel> : <><div className="grid grid-4"><Panel title="전체 데이터"><p><DateValue value={data.dataStart} /> ~ <DateValue value={data.dataEnd} /></p><p className="metric-foot">train {data.trainRowCount.toLocaleString()}건 · test {data.testRowCount.toLocaleString()}건</p></Panel><Panel title="학습 기간"><p><DateValue value={data.trainStart} /> ~ <DateValue value={data.trainEnd} /></p><Badge status={data.trainWindowOk ? 'SAFE' : 'CRITICAL'}>{data.trainWindowOk ? '기간 정상' : '기간 점검 필요'}</Badge></Panel><Panel title="검증 기간"><p><DateValue value={data.testStart} /> ~ <DateValue value={data.testEnd} /></p><Badge status={data.testWindowOk ? 'SAFE' : 'CRITICAL'}>{data.testWindowOk ? '기간 정상' : '기간 점검 필요'}</Badge></Panel><Panel title="Granularity"><p className="metric-value">{data.granularity}</p><p className="metric-foot">학습·검증 데이터 격리 상태</p></Panel></div><div className="section grid grid-3"><Panel title="Policy values"><pre className="settings-json">{JSON.stringify(data.policyValues, null, 2)}</pre></Panel><Panel title="Outlier rules"><pre className="settings-json">{JSON.stringify(data.outlierRules, null, 2)}</pre></Panel><Panel title="Item policies"><pre className="settings-json">{JSON.stringify(data.itemPolicies, null, 2)}</pre></Panel></div></>}</div></main></div>;
}
