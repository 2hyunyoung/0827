import type { ReactNode } from 'react';

export default function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">SCM CONTROL</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <div className="button-row">{action}</div>}</div>;
}
