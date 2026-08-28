export type LeadtimeGap = {
  supplier: string;
  country: string;
  masterLeadTime: number | null;
  sampleCount: number;
  actualAverage: number | null;
  p80: number | null;
  gap: number | null;
};

export type StockoutStatus = 'SAFE' | 'CRITICAL' | 'UNKNOWN';
export type StockoutReason = 'NO_USAGE' | 'NO_LEADTIME' | null;

export type StockoutRisk = {
  itemId: string;
  itemName: string;
  supplier: string;
  currentStock: number;
  inboundQty: number;
  availableQty: number;
  dailyUsageAvg: number | null;
  plannedLeadTime: number | null;
  stockoutDays: number | null;
  stockoutDate: string | null;
  riskStatus: StockoutStatus;
  reason: StockoutReason;
};

export type StockoutKpi = {
  nItems: number;
  nCritical: number;
  nSafe: number;
  nUnknown: number;
  nWithin30d: number;
  avgStockoutDays: number | null;
};

export type ForecastSettings = {
  dataStart: string | null;
  dataEnd: string | null;
  trainStart: string | null;
  trainEnd: string | null;
  testStart: string | null;
  testEnd: string | null;
  trainRowCount: number;
  testRowCount: number;
  trainWindowOk: boolean;
  testWindowOk: boolean;
  granularity: string;
  policyValues: unknown;
  outlierRules: unknown;
  itemPolicies: unknown;
};

function value(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return null;
}

function numberValue(row: Record<string, unknown>, keys: string[]) {
  const raw = value(row, keys);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeLeadtimeGap(row: Record<string, unknown>): LeadtimeGap {
  return {
    supplier: String(value(row, ['supplier_name', 'supplier', '법인', '공급처', '공급업체명']) ?? '미정'),
    country: String(value(row, ['country', '국가']) ?? '미정'),
    masterLeadTime: numberValue(row, ['std_lead_time', 'master_lt', 'master_lead_time', 'planned_lead_time', '표준리드타임', '표준리드타임(일)', '마스터값']),
    sampleCount: numberValue(row, ['n_samples', 'sample_count', 'samples', '표본수']) ?? 0,
    actualAverage: numberValue(row, ['mean_days', 'actual_avg', 'actual_average', 'avg_lead_time', '실적평균']),
    p80: numberValue(row, ['p80_days', 'p80', 'P80']),
    gap: numberValue(row, ['gap_days', 'gap', 'leadtime_gap', '격차']),
  };
}

function statusValue(row: Record<string, unknown>): StockoutStatus {
  const status = String(value(row, ['risk_status', 'status', '위험상태']) ?? 'UNKNOWN').toUpperCase();
  return status === 'SAFE' || status === 'CRITICAL' ? status : 'UNKNOWN';
}

function reasonValue(row: Record<string, unknown>): StockoutReason {
  const reason = value(row, ['reason', '사유']);
  return reason === 'NO_USAGE' || reason === 'NO_LEADTIME' ? reason : null;
}

export function normalizeStockoutRisk(row: Record<string, unknown>): StockoutRisk {
  return {
    itemId: String(value(row, ['item_id', 'itemId', '품목코드']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName', '품목명']) ?? '미정'),
    supplier: String(value(row, ['supplier_name', 'supplier', '법인', '공급처', '공급업체명']) ?? '미정'),
    currentStock: numberValue(row, ['current_stock', 'currentStock', '현재고']) ?? 0,
    inboundQty: numberValue(row, ['inbound_qty', 'inboundQty', '입고예정']) ?? 0,
    availableQty: numberValue(row, ['available_qty', 'availableQty', '가용수량']) ?? 0,
    dailyUsageAvg: numberValue(row, ['daily_usage_avg', 'dailyUsageAvg', '일평균사용량']),
    plannedLeadTime: numberValue(row, ['planned_lead_time', 'plannedLeadTime', '계획리드타임']),
    stockoutDays: numberValue(row, ['stockout_days', 'stockoutDays', '소진일수']),
    stockoutDate: String(value(row, ['stockout_date', 'stockoutDate', '소진예상일']) ?? '') || null,
    riskStatus: statusValue(row),
    reason: reasonValue(row),
  };
}

export function normalizeStockoutKpi(row: Record<string, unknown>): StockoutKpi {
  return {
    nItems: numberValue(row, ['n_items', 'nItems', '전체품목수']) ?? 0,
    nCritical: numberValue(row, ['n_critical', 'nCritical', '긴급품목수']) ?? 0,
    nSafe: numberValue(row, ['n_safe', 'nSafe', '안전품목수']) ?? 0,
    nUnknown: numberValue(row, ['n_unknown', 'nUnknown', '판단불가품목수']) ?? 0,
    nWithin30d: numberValue(row, ['n_within_30d', 'nWithin30d', '30일이내소진수']) ?? 0,
    avgStockoutDays: numberValue(row, ['avg_stockout_days', 'avgStockoutDays', '평균소진일수']),
  };
}

export function normalizeForecastSettings(row: Record<string, unknown>): ForecastSettings {
  const date = (keys: string[]) => String(value(row, keys) ?? '') || null;
  return {
    dataStart: date(['data_start', 'dataStart']),
    dataEnd: date(['data_end', 'dataEnd']),
    trainStart: date(['train_start', 'trainStart']),
    trainEnd: date(['train_end', 'trainEnd']),
    testStart: date(['test_start', 'testStart']),
    testEnd: date(['test_end', 'testEnd']),
    trainRowCount: numberValue(row, ['train_row_count', 'trainRowCount']) ?? 0,
    testRowCount: numberValue(row, ['test_row_count', 'testRowCount']) ?? 0,
    trainWindowOk: value(row, ['train_window_ok', 'trainWindowOk']) === true,
    testWindowOk: value(row, ['test_window_ok', 'testWindowOk']) === true,
    granularity: String(value(row, ['granularity']) ?? '미설정'),
    policyValues: value(row, ['policy_values', 'policyValues']) ?? [],
    outlierRules: value(row, ['outlier_rules', 'outlierRules']) ?? [],
    itemPolicies: value(row, ['item_policies', 'itemPolicies']) ?? [],
  };
}
