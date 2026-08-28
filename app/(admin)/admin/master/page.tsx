import Link from 'next/link';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import EmptyValue from '@/components/ui/empty-value';

export default function AdminMasterPage() {
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="기준정보 관리" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="기준정보 관리" description="확정된 기준값과 연결 상태를 관리합니다." action={<Link href="/" className="button">돌아가기</Link>} /><Panel title="STEP1 준비 상태"><p className="muted">확정된 관리자 기능이 없습니다. 상태: <EmptyValue reason="NOT_CONFIGURED" /></p></Panel></div></main></div>;
}
