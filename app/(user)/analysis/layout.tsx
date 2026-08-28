// 분석 화면(/analysis/*) 공통 껍데기입니다.
//
// 화면을 추가할 때 이 파일은 고치지 않습니다.
// 탭 목록은 components/analysis/analysis-tabs.tsx 한 곳에만 있습니다.

import type { ReactNode } from 'react';
import Link from 'next/link';
import AnalysisTabs from '@/components/analysis/analysis-tabs';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import { getRole } from '@/lib/auth';

export default async function AnalysisLayout({ children }: { children: ReactNode }) {
  const role = (await getRole()) ?? 'USER';
  return <div className="system-shell"><Sidebar role={role} /><main className="system-main"><Topbar title="분석" /><header className="analysis-topbar"><Link href="/" className="analysis-home">← 전체 현황</Link><AnalysisTabs /></header>{children}</main></div>;
}
