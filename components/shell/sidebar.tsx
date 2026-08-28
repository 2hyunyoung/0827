'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuFor, type MenuRole } from '@/lib/menu';

export default function Sidebar({ role = 'USER' }: { role?: MenuRole }) {
  const pathname = usePathname();
  const menus = menuFor(role);
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">OP</div><div className="brand-copy"><strong>월간 발주계획</strong><span>한국후지필름BI</span></div></div>
    <div className="system-nav-label">MENU</div>
    <nav className="system-nav" aria-label="주요 메뉴">
      {menus.map((item) => { const Icon = item.icon; const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href); return <Link key={item.id} href={item.href} className={`system-nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}><span className="system-nav-icon"><Icon size={16} aria-hidden="true" /></span><span>{item.label}</span></Link>; })}
    </nav>
    <div className="sidebar-foot"><b>2026년 09월 발주계획</b><br />로컬 프로토타입 · STEP1</div>
  </aside>;
}
