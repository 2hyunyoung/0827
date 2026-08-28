import { requireAdmin } from '@/lib/auth';
import { getLeadtimePolicy } from '@/lib/scm';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import EmptyValue from '@/components/ui/empty-value';
import Button from '@/components/ui/button';
import { saveLeadtimePolicy } from './actions';
export const dynamic = 'force-dynamic';
const v = (value: number | null) => value === null ? <EmptyValue reason="CALCULATION_UNAVAILABLE" /> : value.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
export default async function LeadtimePolicyPage() { await requireAdmin(); const { rows, error } = await getLeadtimePolicy(); return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Lead Time 정책" eyebrow="SCM POLICIES" /><div className="system-content"><PageHeader title="Effective Lead Time" description="관리자 확정값을 우선하고, 없으면 실적 P80을 적용합니다." /> <Panel title="공급처별 정책"><div className="table-wrap">{error ? <p className="text-danger">조회에 실패했습니다: {error}</p> : <table><thead><tr>{['공급처','국가','표본','P50','P80','P90','확정값','Effective','출처','적용일','저장'].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.supplierId}><td>{row.supplierName ?? row.supplierId}<input type="hidden" name="supplier_id" value={row.supplierId} /></td><td>{row.country ?? '—'}</td><td>{v(row.nSamples)}</td><td>{v(row.p50Days)}</td><td>{v(row.p80Days)}</td><td>{v(row.p90Days)}</td><td><form action={saveLeadtimePolicy} className="inline-policy-form"><input type="hidden" name="supplier_id" value={row.supplierId} /><input className="table-input number" name="planned_lead_time" type="number" min="0" defaultValue={row.plannedLeadTime ?? ''} placeholder="P80" /><input className="table-input" name="confirmed_reason" defaultValue={row.confirmedReason ?? ''} placeholder="변경 사유" /><Button type="submit" variant="primary">저장</Button></form></td><td>{v(row.effectiveLeadTime)}</td><td>{row.source}</td><td>{row.confirmedAt ?? <EmptyValue reason="NOT_CONFIRMED" />}</td><td>{row.lastChangedAt ?? <EmptyValue reason="NO_HISTORY" />}</td></tr>)}{!rows.length && <tr><td colSpan={11} className="muted">Lead Time 데이터가 없습니다.</td></tr>}</tbody></table>}</div></Panel></div></main></div>; }
