import { requireAdmin } from '@/lib/auth';
import { getForecastRunKpis, getForecastRuns } from '@/lib/scm';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import EmptyValue from '@/components/ui/empty-value';
import { runBaselineForecast } from '../forecast-models/actions';

export const dynamic = 'force-dynamic';

function statusBadge(status: string) { return status === 'SUCCESS' ? 'SAFE' : status === 'RUNNING' ? 'WARNING' : 'CRITICAL'; }
function value(value: string | null) { return value ? <span>{value}</span> : <EmptyValue reason="NOT_AVAILABLE" />; }

export default async function ForecastRunsPage() {
  await requireAdmin();
  const [{ rows, error }, kpis] = await Promise.all([getForecastRuns(), getForecastRunKpis()]);
  const kpiByRun = new Map(kpis.rows.map((item) => [item.runId, item]));
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Forecast 실행 이력" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="Forecast Run" description="학습 구간을 기준으로 Baseline 예측을 실행하고 재현 가능한 실행 이력을 확인합니다." action={<form action={runBaselineForecast}><Button variant="primary" type="submit">Baseline 실행</Button></form>} />{error ? <Panel><p className="text-danger">조회에 실패했습니다: {error}</p></Panel> : <Panel title="실행 이력" meta={<span>{rows.length.toLocaleString()}건</span>}><div className="table-wrap"><table><thead><tr>{['상태','실행 시각','학습 구간','Horizon','모델','품목','결과 행','계산 불가','Snapshot','최신성'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((run) => { const kpi = kpiByRun.get(run.runId); return <tr key={run.runId}><td><Badge status={statusBadge(run.status) as 'SAFE' | 'WARNING' | 'CRITICAL'}>{run.status}</Badge></td><td>{value(run.startedAt)}</td><td>{run.trainStart} ~ {run.trainEnd}</td><td className="num">{run.horizon}</td><td className="num">{kpi?.nModels ?? run.nModels}</td><td className="num">{kpi?.nItems ?? run.nItems}</td><td className="num">{kpi?.nRows ?? run.nRows}</td><td className="num">{kpi?.nCalculationUnavailable ?? 0}</td><td>{value(run.dataSnapshotAt)}</td><td><Badge status={run.isStale ? 'WARNING' : 'SAFE'}>{run.isStale ? 'STALE' : '최신'}</Badge></td></tr>; })}{!rows.length && <tr><td colSpan={10} className="muted">실행 이력이 없습니다.</td></tr>}</tbody></table></div></Panel>}</div></main></div>;
}
