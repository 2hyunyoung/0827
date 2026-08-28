import type { ReactNode } from 'react';

export type BadgeStatus = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE';
const labels: Record<BadgeStatus, string> = { SAFE: '안전', WARNING: '주의', CRITICAL: '위험', CALCULATION_UNAVAILABLE: '계산 불가' };
export default function Badge({ status, children }: { status: BadgeStatus; children?: ReactNode }) { return <span className={`ui-badge ${status.toLowerCase().replaceAll('_', '-')}`}>{children ?? labels[status]}</span>; }
