import { requireAdmin } from '@/lib/auth';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Button from '@/components/ui/button';
import { runBacktest } from '../forecast-models/actions';

export const dynamic = 'force-dynamic';
export default async function BacktestPage() {
  await requireAdmin();
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Backtest 실행" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="Validation Backtest" description="가장 최근 Forecast Run과 검증기간 Actual을 비교합니다. Forecast를 다시 실행하지 않습니다." /><Panel title="실행"><form action={runBacktest} className="button-row"><Button variant="primary" type="submit">최근 Forecast Run Backtest</Button></form><p className="muted">계산 결과는 SQL에 저장되며 Model Comparison 화면에서 조회합니다.</p></Panel></div></main></div>;
}
