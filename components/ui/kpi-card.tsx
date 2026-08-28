import type { ReactNode } from 'react';

export default function KpiCard({ label, value, foot, tone, children }: { label: string; value: ReactNode; foot?: ReactNode; tone?: 'safe' | 'warning' | 'critical'; children?: ReactNode }) {
  return <div className={`card metric ui-kpi-card ${tone ? `text-${tone}` : ''}`}>{children}<div className="metric-label">{label}</div><div className="metric-value">{value}</div>{foot && <div className={`metric-foot ${tone === 'warning' ? 'warn' : tone === 'critical' ? 'danger' : tone === 'safe' ? 'good' : ''}`}>{foot}</div>}</div>;
}
