import Link from 'next/link';
import LogoutButton from '@/components/auth/logout-button';

export default function Topbar({ title, eyebrow = 'MONTHLY PROCUREMENT CONTROL' }: { title: string; eyebrow?: string }) {
  return <header className="topbar"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div><div className="top-meta"><span className="local-badge">SUPABASE LIVE</span><Link href="/admin/master" className="muted">기준정보</Link><span>기준월 <b>2026.09</b></span><LogoutButton /></div></header>;
}
