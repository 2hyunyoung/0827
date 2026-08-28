import { requireUser } from '@/lib/auth';
import { getInventoryProjection } from '@/lib/scm';
import AnalysisFrame from '@/components/analysis/analysis-frame';
import Panel from '@/components/ui/panel';
import EmptyValue from '@/components/ui/empty-value';

export const dynamic = 'force-dynamic';
function value(value: number | null) { return value === null ? <EmptyValue reason="CALCULATION_UNAVAILABLE" /> : value.toLocaleString('ko-KR', { maximumFractionDigits: 1 }); }
export default async function InventoryProjectionPage() { await requireUser(); const { rows, error } = await getInventoryProjection(); return <AnalysisFrame title="Inventory Projection" description="Champion Forecast와 재고·입고·수주·가예약을 결합한 기간별 재고 전망입니다."><Panel title="기간별 Projection">{error ? <p className="text-danger">조회에 실패했습니다: {error}</p> : <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr>{['SKU','품목명','Period','Beginning','Receipt','Confirmed SO','Soft Allocation','Forecast','Ending','Stockout'].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={`${row.itemId}-${row.period}`}><td>{row.itemId}</td><td>{row.itemName}</td><td>{row.period}</td><td>{value(row.beginningInventory)}</td><td>{value(row.scheduledReceipts)}</td><td>{value(row.confirmedSalesOrder)}</td><td>{value(row.softAllocation)}</td><td>{value(row.forecastDemand)}</td><td>{value(row.endingProjectedInventory)}</td><td>{row.stockoutPeriod ?? <EmptyValue reason="NO_STOCKOUT" />}</td></tr>)}{!rows.length && <tr><td colSpan={10} className="muted">Projection 데이터가 없습니다.</td></tr>}</tbody></table></div>}</Panel></AnalysisFrame>; }
