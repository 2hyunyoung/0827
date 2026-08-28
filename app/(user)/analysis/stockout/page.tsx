import AnalysisFrame from '@/components/analysis/analysis-frame';
import { formatNumber } from '@/components/analysis/data-table';
import { getStockoutKpi, getStockoutRisk } from '@/lib/scm';
import type { StockoutRisk, StockoutStatus } from '@/lib/scm-model';
import KpiCard from '@/components/ui/kpi-card';
import EmptyValue from '@/components/ui/empty-value';
import Badge from '@/components/ui/badge';
import UiDataTable, { type UiColumn } from '@/components/ui/data-table';

export const dynamic = 'force-dynamic';

function statusLabel(status: StockoutStatus) {
  if (status === 'CRITICAL') return '위험';
  if (status === 'WARNING') return '주의';
  if (status === 'SAFE') return '안전';
  return '판단 불가';
}

function formatDate(value: string | null) {
  if (!value) return <EmptyValue reason="NO_STOCKOUT_DATE" />;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ko-KR');
}

function reasonLabel(row: StockoutRisk) {
  if (row.reason === 'NO_USAGE') return '사용 이력 없음';
  if (row.reason === 'NO_LEADTIME') return '리드타임 없음';
  return <EmptyValue reason="NO_REASON" />;
}

const columns: UiColumn<StockoutRisk>[] = [
  { key: 'itemName', label: '품목', render: (row) => `${row.itemName} (${row.itemId})` },
  { key: 'supplier', label: '공급처' },
  { key: 'currentStock', label: '현재고', align: 'right', render: (row) => formatNumber(row.currentStock) },
  { key: 'inboundQty', label: '입고예정', align: 'right', render: (row) => formatNumber(row.inboundQty) },
  { key: 'availableQty', label: '현재 가용수량', align: 'right', render: (row) => row.availableQty === null ? <EmptyValue reason="NO_INVENTORY_DATA" /> : formatNumber(row.availableQty) },
  { key: 'dailyUsageAvg', label: '일평균 사용량', align: 'right', render: (row) => row.dailyUsageAvg === null ? <EmptyValue reason="NO_USAGE" /> : formatNumber(row.dailyUsageAvg) },
  { key: 'stockoutDays', label: '소진까지', align: 'right', render: (row) => row.stockoutDays === null ? <EmptyValue reason={row.reason} /> : formatNumber(row.stockoutDays, '일') },
  { key: 'stockoutDate', label: '소진예상일', align: 'right', render: (row) => formatDate(row.stockoutDate) },
  { key: 'riskStatus', label: '상태', align: 'center', render: (row) => <Badge status={row.riskStatus === 'CRITICAL' ? 'CRITICAL' : row.riskStatus === 'WARNING' ? 'WARNING' : row.riskStatus === 'SAFE' ? 'SAFE' : 'CALCULATION_UNAVAILABLE'}>{statusLabel(row.riskStatus)}</Badge> },
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
        <KpiCard label="전체 품목" value={kpi ? kpi.nItems : <EmptyValue reason="NO_KPI" />} foot="재고 분석 대상" />
        <KpiCard label="위험 품목" value={kpi ? kpi.nCritical : <EmptyValue reason="NO_KPI" />} foot="리드타임 내 소진 위험" tone="critical" />
        <KpiCard label="30일 이내 소진" value={kpi ? kpi.nWithin30d : <EmptyValue reason="NO_KPI" />} foot="소진예상일 기준" tone="warning" />
      </div>

      <div className="grid grid-3">
        <KpiCard label="안전 품목" value={kpi ? kpi.nSafe : <EmptyValue reason="NO_KPI" />} foot="현재 기준 안전" tone="safe" />
        <KpiCard label="주의 품목" value={kpi ? kpi.nWarning : <EmptyValue reason="NO_KPI" />} foot="리드타임 이후 소진 예상" tone="warning" />
        <KpiCard label="계산 불가" value={kpi ? kpi.nUnknown : <EmptyValue reason="NO_KPI" />} foot="재고·Forecast·리드타임 부족" />
        <KpiCard label="평균 소진까지" value={kpi?.avgStockoutDays === null || kpi?.avgStockoutDays === undefined ? <EmptyValue reason="NO_USAGE" /> : formatNumber(kpi.avgStockoutDays, '일')} foot="계산 가능한 품목 기준" />
      </div>

      <div className="section card">
        <div className="card-title"><h3>기간별 Inventory Projection 요약</h3><span>Forecast·입고·수주·가예약 반영</span></div>
        <UiDataTable columns={columns} rows={rows} rowKey={(row) => row.itemId} empty="표시할 데이터가 없습니다." />
      </div>
    </AnalysisFrame>
  );
}
