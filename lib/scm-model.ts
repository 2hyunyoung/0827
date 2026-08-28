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

export type DemandType = 'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY';
export type SkuDemandProfile = {
  itemId: string;
  itemName: string;
  nPeriods: number;
  nNonzeroPeriods: number;
  adi: number | null;
  cv: number | null;
  cvSquared: number | null;
  zeroDemandRate: number | null;
  trend: number | null;
  recentChangeRate: number | null;
  peakPeriod: string | null;
  demandType: DemandType | null;
  seasonality: boolean | null;
  reasonCode: string | null;
  stability: string | null;
};
export type DemandProfileKpi = { totalItems: number; nSmooth: number; nIntermittent: number; nErratic: number; nLumpy: number; nCrostonNeeded: number; nCalculationUnavailable: number };

export type ForecastModelConfig = {
  modelId: string;
  modelName: string;
  family: string;
  engine: string;
  version: string;
  enabled: boolean;
  isDefault: boolean;
  applicableDemandType: DemandType[];
  parameters: Record<string, unknown>;
  description: string | null;
  updatedAt: string | null;
};

export type ForecastRun = {
  runId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  granularity: string;
  trainStart: string;
  trainEnd: string;
  horizon: number;
  championMetric: string | null;
  dataSnapshotAt: string;
  models: unknown;
  nModels: number;
  nItems: number;
  nRows: number;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  triggeredEmail: string | null;
  note: string | null;
  message: string | null;
  isStale: boolean;
};

export type ForecastRunKpi = { runId: string; nModels: number; nItems: number; nRows: number; nCalculated: number; nCalculationUnavailable: number };
export type ModelPerformance = { backtestRunId: string; runId: string; modelId: string; modelVersion: string | null; itemId: string; nPeriods: number; wape: number | null; mape: number | null; bias: number | null; rmse: number | null; mae: number | null; baselineImprovement: number | null; rank: number | null; calculationStatus: string; reasonCode: string | null };
export type ModelComparisonRow = ModelPerformance & { period: string; predictedQty: number | null; actualQty: number | null; p50: number | null; p80: number | null; p90: number | null; isChampion: boolean };

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

export function normalizeDemandProfile(row: Record<string, unknown>): SkuDemandProfile {
  const text = (keys: string[]) => String(value(row, keys) ?? '') || null;
  const demandType = text(['demand_type', 'demandType']);
  return { itemId: String(value(row, ['item_id', 'itemId', '품목코드']) ?? '미정'), itemName: String(value(row, ['item_name', 'itemName', '품목명']) ?? '미정'), nPeriods: numberValue(row, ['n_periods', 'nPeriods']) ?? 0, nNonzeroPeriods: numberValue(row, ['n_nonzero_periods', 'nNonzeroPeriods']) ?? 0, adi: numberValue(row, ['adi']), cv: numberValue(row, ['cv']), cvSquared: numberValue(row, ['cv_squared', 'cvSquared']), zeroDemandRate: numberValue(row, ['zero_demand_rate', 'zeroDemandRate']), trend: numberValue(row, ['trend', 'trend_per_period']), recentChangeRate: numberValue(row, ['recent_change_rate', 'recentChangeRate']), peakPeriod: text(['peak_period', 'peakPeriod']), demandType: demandType === 'SMOOTH' || demandType === 'INTERMITTENT' || demandType === 'ERRATIC' || demandType === 'LUMPY' ? demandType : null, seasonality: typeof value(row, ['seasonality']) === 'boolean' ? value(row, ['seasonality']) as boolean : null, reasonCode: text(['reason_code', 'reasonCode']), stability: text(['stability']) };
}

export function normalizeDemandProfileKpi(row: Record<string, unknown>): DemandProfileKpi { return { totalItems: numberValue(row, ['total_items']) ?? 0, nSmooth: numberValue(row, ['n_smooth']) ?? 0, nIntermittent: numberValue(row, ['n_intermittent']) ?? 0, nErratic: numberValue(row, ['n_erratic']) ?? 0, nLumpy: numberValue(row, ['n_lumpy']) ?? 0, nCrostonNeeded: numberValue(row, ['n_croston_needed']) ?? 0, nCalculationUnavailable: numberValue(row, ['n_calculation_unavailable']) ?? 0 }; }

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

function demandTypes(value: unknown): DemandType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is DemandType => item === 'SMOOTH' || item === 'INTERMITTENT' || item === 'ERRATIC' || item === 'LUMPY');
}

export function normalizeForecastModel(row: Record<string, unknown>): ForecastModelConfig {
  const text = (keys: string[]) => String(value(row, keys) ?? '') || null;
  const parameters = value(row, ['parameters']);
  return {
    modelId: String(value(row, ['model_id', 'modelId']) ?? '미정'),
    modelName: String(value(row, ['model_name', 'modelName']) ?? '미정'),
    family: String(value(row, ['family']) ?? '미정'),
    engine: String(value(row, ['engine']) ?? 'SQL_BASELINE'),
    version: String(value(row, ['version']) ?? '미정'),
    enabled: value(row, ['enabled']) === true,
    isDefault: value(row, ['is_default', 'isDefault']) === true,
    applicableDemandType: demandTypes(value(row, ['applicable_demand_type', 'applicableDemandType'])),
    parameters: parameters && typeof parameters === 'object' && !Array.isArray(parameters) ? parameters as Record<string, unknown> : {},
    description: text(['description']),
    updatedAt: text(['updated_at', 'updatedAt']),
  };
}

export function normalizeForecastRun(row: Record<string, unknown>): ForecastRun {
  const status = String(value(row, ['status']) ?? 'FAILED');
  return {
    runId: String(value(row, ['run_id', 'runId']) ?? '미정'),
    status: status === 'RUNNING' || status === 'SUCCESS' ? status : 'FAILED',
    granularity: String(value(row, ['granularity']) ?? '미정'),
    trainStart: String(value(row, ['train_start']) ?? ''),
    trainEnd: String(value(row, ['train_end']) ?? ''),
    horizon: numberValue(row, ['horizon']) ?? 0,
    championMetric: String(value(row, ['champion_metric']) ?? '') || null,
    dataSnapshotAt: String(value(row, ['data_snapshot_at']) ?? ''),
    models: value(row, ['models']) ?? [],
    nModels: numberValue(row, ['n_models']) ?? 0,
    nItems: numberValue(row, ['n_items']) ?? 0,
    nRows: numberValue(row, ['n_rows']) ?? 0,
    startedAt: String(value(row, ['started_at']) ?? '') || null,
    finishedAt: String(value(row, ['finished_at']) ?? '') || null,
    durationMs: numberValue(row, ['duration_ms']),
    triggeredEmail: String(value(row, ['triggered_email']) ?? '') || null,
    note: String(value(row, ['note']) ?? '') || null,
    message: String(value(row, ['message']) ?? '') || null,
    isStale: value(row, ['is_stale']) === true,
  };
}

export function normalizeForecastRunKpi(row: Record<string, unknown>): ForecastRunKpi {
  return { runId: String(value(row, ['run_id']) ?? '미정'), nModels: numberValue(row, ['n_models']) ?? 0, nItems: numberValue(row, ['n_items']) ?? 0, nRows: numberValue(row, ['n_rows']) ?? 0, nCalculated: numberValue(row, ['n_calculated']) ?? 0, nCalculationUnavailable: numberValue(row, ['n_calculation_unavailable']) ?? 0 };
}

export function normalizeModelPerformance(row: Record<string, unknown>): ModelPerformance { return { backtestRunId: String(value(row, ['backtest_run_id']) ?? ''), runId: String(value(row, ['run_id']) ?? ''), modelId: String(value(row, ['model_id']) ?? ''), modelVersion: String(value(row, ['model_version']) ?? '') || null, itemId: String(value(row, ['item_id']) ?? ''), nPeriods: numberValue(row, ['n_periods']) ?? 0, wape: numberValue(row, ['wape']), mape: numberValue(row, ['mape']), bias: numberValue(row, ['bias']), rmse: numberValue(row, ['rmse']), mae: numberValue(row, ['mae']), baselineImprovement: numberValue(row, ['baseline_improvement']), rank: numberValue(row, ['rank']), calculationStatus: String(value(row, ['calculation_status']) ?? 'CALCULATION_UNAVAILABLE'), reasonCode: String(value(row, ['reason_code']) ?? '') || null }; }
export function normalizeModelComparison(row: Record<string, unknown>): ModelComparisonRow { return { ...normalizeModelPerformance(row), period: String(value(row, ['period']) ?? ''), predictedQty: numberValue(row, ['predicted_qty']), actualQty: numberValue(row, ['actual_qty']), p50: numberValue(row, ['p50']), p80: numberValue(row, ['p80']), p90: numberValue(row, ['p90']), isChampion: value(row, ['is_champion']) === true }; }
