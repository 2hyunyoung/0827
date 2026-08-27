import AnalysisFrame from '@/components/analysis/analysis-frame';
import DataTable, { formatNumber, type Column } from '@/components/analysis/data-table';
import { getStockoutKpi, getStockoutRisk } from '@/lib/scm';
import type { StockoutRisk, StockoutStatus } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function statusLabel(status: StockoutStatus) {
  if (status === 'CRITICAL') return '긴급';
  if (status === 'SAFE') return '안전';
  return '판단 불가';
}

function statusClass(status: StockoutStatus) {
  if (status === 'CRITICAL') return 'tag red';
  if (status === 'SAFE') return 'tag green';
  return 'tag gray';
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ko-KR');
}

function reasonLabel(row: StockoutRisk) {
  if (row.reason === 'NO_USAGE') return '사용 이력 없음';
  if (row.reason === 'NO_LEADTIME') return '리드타임 없음';
  return '—';
}

const columns: Column<StockoutRisk>[] = [
  { key: 'itemName', label: '품목', render: (row) => `${row.itemName} (${row.itemId})` },
  { key: 'supplier', label: '공급처' },
  { key: 'currentStock', label: '현재고', align: 'right', render: (row) => formatNumber(row.currentStock) },
  { key: 'inboundQty', label: '입고예정', align: 'right', render: (row) => formatNumber(row.inboundQty) },
  { key: 'availableQty', label: '가용수량', align: 'right', render: (row) => formatNumber(row.availableQty) },
  { key: 'dailyUsageAvg', label: '일평균 사용량', align: 'right', render: (row) => formatNumber(row.dailyUsageAvg) },
  { key: 'stockoutDays', label: '소진까지', align: 'right', render: (row) => formatNumber(row.stockoutDays, '일') },
  { key: 'stockoutDate', label: '소진예상일', align: 'right', render: (row) => formatDate(row.stockoutDate) },
  { key: 'riskStatus', label: '상태', align: 'center', render: (row) => <span className={statusClass(row.riskStatus)}>{statusLabel(row.riskStatus)}</span> },
  { key: 'reason', label: '사유', render: reasonLabel },
];

export default async function StockoutPage() {
  const [{ rows, error: riskError }, { data: kpi, error: kpiError }] = await Promise.all([
    getStockoutRisk(),
    getStockoutKpi(),
  ]);

  const error = riskError ?? kpiError;
  if (error) {
    return (
      <AnalysisFrame title="재고 소진 위험" description="가용재고와 평균 사용량을 바탕으로 품목별 소진 위험을 확인합니다.">
        <div className="card">
          <p className="text-danger">조회에 실패했습니다.</p>
          <p className="muted">{error}</p>
        </div>
      </AnalysisFrame>
    );
  }

  if (rows.length === 0) {
    return (
      <AnalysisFrame title="재고 소진 위험" description="가용재고와 평균 사용량을 바탕으로 품목별 소진 위험을 확인합니다.">
        <div className="card"><p className="muted">표시할 데이터가 없습니다. analytics.v_stockout_risk를 확인하세요.</p></div>
      </AnalysisFrame>
    );
  }

  return (
    <AnalysisFrame title="재고 소진 위험" description="가용재고와 평균 사용량을 바탕으로 품목별 소진 위험을 확인합니다.">
      <div className="grid grid-3">
        <div className="card metric"><div className="metric-label">전체 품목</div><div className="metric-value">{kpi ? kpi.nItems : '—'}</div><div className="metric-foot">재고 분석 대상</div></div>
        <div className="card metric"><div className="metric-label">긴급 품목</div><div className="metric-value">{kpi ? kpi.nCritical : '—'}</div><div className="metric-foot warn">리드타임 내 소진 위험</div></div>
        <div className="card metric"><div className="metric-label">30일 이내 소진</div><div className="metric-value">{kpi ? kpi.nWithin30d : '—'}</div><div className="metric-foot">소진예상일 기준</div></div>
      </div>

      <div className="grid grid-3">
        <div className="card metric"><div className="metric-label">안전 품목</div><div className="metric-value">{kpi ? kpi.nSafe : '—'}</div><div className="metric-foot">현재 기준 안전</div></div>
        <div className="card metric"><div className="metric-label">판단 불가</div><div className="metric-value">{kpi ? kpi.nUnknown : '—'}</div><div className="metric-foot">사용량 또는 리드타임 부족</div></div>
        <div className="card metric"><div className="metric-label">평균 소진까지</div><div className="metric-value">{formatNumber(kpi?.avgStockoutDays ?? null, '일')}</div><div className="metric-foot">계산 가능한 품목 기준</div></div>
      </div>

      <div className="section card">
        <div className="card-title"><h3>품목별 소진 위험</h3><span>가용수량 ÷ 일평균 사용량</span></div>
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.itemId} empty="표시할 데이터가 없습니다." />
      </div>
    </AnalysisFrame>
  );
}
