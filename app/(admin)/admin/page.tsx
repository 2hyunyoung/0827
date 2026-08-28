import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';

export const dynamic = 'force-dynamic';

const links = [
  ['사용자 관리', '/admin/users', 'ADMIN 계정과 활성 상태를 관리합니다.'],
  ['데이터 적재 관리', '/admin/data-management', '파일 검증과 RAW 적재 이력을 관리합니다.'],
  ['Forecast 설정', '/admin/forecast-settings', '학습·검증 기간과 운영 정책을 확인합니다.'],
  ['Forecast 모델', '/admin/forecast-models', 'Baseline 및 Python 모델을 관리합니다.'],
  ['Forecast 실행 이력', '/admin/forecast-runs', 'Forecast 실행 결과와 최신성 상태를 확인합니다.'],
  ['Backtest 실행', '/admin/backtest', '검증기간 Actual로 모델 성능을 계산합니다.'],
];

export default async function AdminHomePage() {
  await requireAdmin();
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="관리자 콘솔" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="관리자 콘솔" description="권한이 필요한 설정·적재·예측 작업을 한 곳에서 관리합니다." /><div className="admin-link-grid">{links.map(([label, href, description]) => <Link className="admin-link-card" href={href} key={href}><strong>{label}</strong><span>{description}</span><em>열기 →</em></Link>)}</div></div></main></div>;
}
