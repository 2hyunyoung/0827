import Link from 'next/link';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import InsightBanner from '@/components/ui/insight-banner';

export default function UserHomePage() {
  return <div className="system-shell"><Sidebar /><main className="system-main"><Topbar title="전체 현황" /><div className="system-content"><PageHeader title="월간 발주계획" description="공급·재고·발주 현황을 한 곳에서 확인하고 다음 업무로 이동합니다." action={<Link href="/workflow" className="button primary">발주계획 시작</Link>} /><div className="grid grid-3"><KpiCard label="분석 화면" value="2" foot="리드타임·재고 소진" /><KpiCard label="기준월" value="2026.09" foot="월간 발주계획" /><KpiCard label="상태" value="준비 중" foot="데이터 기준 확인 필요" tone="warning" /></div><div className="section grid grid-2"><Panel title="분석 바로가기" meta="analytics"><div className="button-row"><Link href="/analysis/leadtime" className="button ghost">리드타임 격차</Link><Link href="/analysis/stockout" className="button ghost">재고 소진 위험</Link></div></Panel><Panel title="다음 단계"><InsightBanner title="STEP1 디자인 시스템 적용">공통 메뉴와 화면 컴포넌트가 준비되었습니다. 분석 화면에서 상세 결과를 확인하세요.</InsightBanner></Panel></div></div></main></div>;
}
