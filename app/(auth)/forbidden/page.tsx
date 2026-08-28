import Link from 'next/link';

export default function ForbiddenPage() { return <main className="content"><section className="card"><h1>접근 권한이 없습니다.</h1><p className="muted">관리자 권한이 필요한 화면입니다.</p><Link href="/" className="button">전체 현황으로 이동</Link></section></main>; }
