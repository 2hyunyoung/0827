import type { ReactNode } from 'react';

export default function AlertRow({ children, critical = false }: { children: ReactNode; critical?: boolean }) { return <div className={`ui-alert-row ${critical ? 'critical' : ''}`} role="alert">{children}</div>; }
