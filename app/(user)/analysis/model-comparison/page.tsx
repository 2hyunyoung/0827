import { requireUser } from '@/lib/auth';
import { getModelComparison, getModelPerformance } from '@/lib/scm';
import AnalysisFrame from '@/components/analysis/analysis-frame';
import AnalysisTabs from '@/components/analysis/analysis-tabs';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import ForecastOverlayChart from '@/components/chart/forecast-overlay-chart';

export const dynamic = 'force-dynamic';
function n(value: number | null) { return value === null ? <EmptyValue reason="CALCULATION_UNAVAILABLE" /> : `${(value * 100).toFixed(2)}%`; }
function raw(value: number | null) { return value === null ? <EmptyValue reason="CALCULATION_UNAVAILABLE" /> : value.toFixed(2); }

export default async function ModelComparisonPage() {
  await requireUser();
  const [{ rows, error }, performance] = await Promise.all([getModelComparison(), getModelPerformance()]);
  const firstItem = rows[0]?.itemId;
  const chartRows = firstItem ? rows.filter((row) => row.itemId === firstItem) : [];
  return <div className="analysis-shell"><div className="analysis-topbar"><a className="analysis-home" href="/">SCM CONTROL</a><AnalysisTabs /></div><AnalysisFrame title="Model Comparison" description="검증기간 Actual과 저장된 Forecast Result를 모델별 성능과 함께 비교합니다."><Panel title="모델 오버레이"><p className="muted">{firstItem ? `대표 SKU ${firstItem}의 저장 결과` : '비교 가능한 Forecast Result가 없습니다.'}</p>{chartRows.length ? <ForecastOverlayChart rows={chartRows} /> : <p className="muted">Backtest 완료 후 비교 차트가 표시됩니다.</p>}</Panel><Panel title="SKU·모델 성능"><div className="analysis-table-wrap">{error || performance.error ? <p className="text-danger">조회에 실패했습니다: {error ?? performance.error}</p> : <table className="analysis-table"><thead><tr>{['SKU','Model','WAPE','MAPE','Bias','RMSE','MAE','Rank','Champion','상태'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{performance.rows.map((row) => <tr key={`${row.backtestRunId}-${row.modelId}-${row.itemId}`}><td>{row.itemId}</td><td>{row.modelId}</td><td>{n(row.wape)}</td><td>{n(row.mape)}</td><td>{raw(row.bias)}</td><td>{raw(row.rmse)}</td><td>{raw(row.mae)}</td><td>{row.rank ?? <EmptyValue reason="NO_RANK" />}</td><td>{rows.some((item) => item.itemId === row.itemId && item.modelId === row.modelId && item.isChampion) ? <Badge status="SAFE">Champion</Badge> : '—'}</td><td>{row.calculationStatus === 'SUCCESS' ? <Badge status="SAFE">계산 완료</Badge> : <Badge status="CALCULATION_UNAVAILABLE">{row.reasonCode ?? '계산 불가'}</Badge>}</td></tr>)}{!performance.rows.length && <tr><td colSpan={10} className="muted">Backtest 성능 결과가 없습니다.</td></tr>}</tbody></table>}</div></Panel></AnalysisFrame></div>;
}
