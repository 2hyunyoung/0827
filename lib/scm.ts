import { createSupabaseServerClient } from './supabase';
import {
  normalizeLeadtimeGap,
  normalizeStockoutKpi,
  normalizeStockoutRisk,
  normalizeForecastSettings,
  type LeadtimeGap,
  type StockoutKpi,
  type StockoutRisk,
  type ForecastSettings,
  normalizeDemandProfile,
  normalizeDemandProfileKpi,
  type SkuDemandProfile,
  type DemandProfileKpi,
  normalizeForecastModel,
  normalizeForecastRun,
  normalizeForecastRunKpi,
  type ForecastModelConfig,
  type ForecastRun,
  type ForecastRunKpi,
  normalizeModelPerformance,
  normalizeModelComparison,
  type ModelPerformance,
  type ModelComparisonRow,
  type InventoryProjection,
  type LeadtimePolicy,
  type PurchaseRecommendation,
} from './scm-model';

export async function getDemandProfile(): Promise<{ rows: SkuDemandProfile[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_sku_demand_profile').select('*').order('item_id'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((row) => normalizeDemandProfile(row as Record<string, unknown>)), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '수요 프로파일 조회에 실패했습니다.' }; } }
export async function getDemandProfileKpi(): Promise<{ data: DemandProfileKpi | null; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_demand_profile_kpi').select('*').maybeSingle(); if (error) return { data: null, error: error.message }; return { data: data ? normalizeDemandProfileKpi(data as Record<string, unknown>) : null, error: null }; } catch (error) { return { data: null, error: error instanceof Error ? error.message : '수요 프로파일 KPI 조회에 실패했습니다.' }; } }

export async function getLeadtimeGap(): Promise<{ rows: LeadtimeGap[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_leadtime_gap').select('*');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeLeadtimeGap(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getForecastSettings(): Promise<{ data: ForecastSettings | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_forecast_settings').select('*').maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ? normalizeForecastSettings(data as Record<string, unknown>) : null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Forecast 설정 조회에 실패했습니다.' };
  }
}

export async function getStockoutKpi() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_stockout_kpi').select('*').maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ? normalizeStockoutKpi(data as Record<string, unknown>) : null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getStockoutRisk(): Promise<{ rows: StockoutRisk[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_stockout_risk').select('*');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeStockoutRisk(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export type ForecastDemandRow = {
  usage_id: string;
  item_id: string;
  use_date: string;
  qty: number | null;
  warehouse: string | null;
  note: string | null;
  batch_id: string | null;
  source_type: string | null;
  loaded_at: string | null;
  source_record_id: string | null;
  data_split: 'TRAIN' | 'TEST';
};

export async function getTrainDemand(): Promise<{ rows: ForecastDemandRow[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('core').from('v_train_demand').select('*');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as ForecastDemandRow[], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : '학습 데이터 조회에 실패했습니다.' };
  }
}

export async function getTestActual(): Promise<{ rows: ForecastDemandRow[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('core').from('v_test_actual').select('*');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as ForecastDemandRow[], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : '검증 데이터 조회에 실패했습니다.' };
  }
}

export async function getForecastModels(): Promise<{ rows: ForecastModelConfig[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_model_config').select('*').order('model_id');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeForecastModel(row as Record<string, unknown>)), error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '모델 설정 조회에 실패했습니다.' }; }
}

export async function getForecastRuns(): Promise<{ rows: ForecastRun[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_forecast_run').select('*').order('started_at', { ascending: false });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeForecastRun(row as Record<string, unknown>)), error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'Forecast 실행 이력 조회에 실패했습니다.' }; }
}

export async function getForecastRunKpis(): Promise<{ rows: ForecastRunKpi[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_forecast_run_kpi').select('*');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeForecastRunKpi(row as Record<string, unknown>)), error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'Forecast KPI 조회에 실패했습니다.' }; }
}

export async function getModelPerformance(): Promise<{ rows: ModelPerformance[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_model_performance').select('*').order('item_id').order('rank'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((row) => normalizeModelPerformance(row as Record<string, unknown>)), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '모델 성능 조회에 실패했습니다.' }; } }
export async function getModelComparison(): Promise<{ rows: ModelComparisonRow[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_model_comparison').select('*').order('item_id').order('period'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((row) => normalizeModelComparison(row as Record<string, unknown>)), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '모델 비교 조회에 실패했습니다.' }; } }
export async function getInventoryProjection(): Promise<{ rows: InventoryProjection[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_inventory_projection').select('*').order('item_id').order('period'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((r) => { const row = r as Record<string, unknown>; const num = (key: string) => row[key] === null || row[key] === undefined ? null : Number(row[key]); return { itemId: String(row.item_id ?? ''), itemName: String(row.item_name ?? ''), supplierId: row.supplier_id ? String(row.supplier_id) : null, period: String(row.period ?? ''), beginningInventory: num('beginning_inventory'), scheduledReceipts: Number(row.scheduled_receipts ?? 0), confirmedSalesOrder: Number(row.confirmed_sales_order ?? 0), softAllocation: Number(row.soft_allocation ?? 0), forecastDemand: num('forecast_demand'), endingProjectedInventory: num('ending_projected_inventory'), stockoutPeriod: row.stockout_period ? String(row.stockout_period) : null, effectiveLeadTime: num('effective_lead_time'), reasonCode: row.reason_code ? String(row.reason_code) : null }; }), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '재고 Projection 조회에 실패했습니다.' }; } }
export async function getLeadtimePolicy(): Promise<{ rows: LeadtimePolicy[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_leadtime_policy').select('*').order('supplier_id'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((r) => { const row = r as Record<string, unknown>; const num = (key: string) => row[key] === null || row[key] === undefined ? null : Number(row[key]); return { supplierId: String(row.supplier_id ?? ''), supplierName: row.supplier_name ? String(row.supplier_name) : null, country: row.country ? String(row.country) : null, nSamples: num('n_samples'), p50Days: num('p50_days'), p80Days: num('p80_days'), p90Days: num('p90_days'), plannedLeadTime: num('planned_lead_time'), effectiveLeadTime: num('effective_lead_time'), source: String(row.source ?? ''), confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null, confirmedReason: row.confirmed_reason ? String(row.confirmed_reason) : null, lastChangedAt: row.last_changed_at ? String(row.last_changed_at) : null }; }), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'Lead Time 정책 조회에 실패했습니다.' }; } }
export async function getPurchaseRecommendations(): Promise<{ rows: PurchaseRecommendation[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('purchase_recommendation').select('*').order('item_id'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((r) => { const x = r as Record<string, unknown>; const num = (key: string) => x[key] === null || x[key] === undefined ? null : Number(x[key]); return { itemId: String(x.item_id ?? ''), itemName: String(x.item_name ?? ''), itemGrade: x.item_grade ? String(x.item_grade) : null, forecastQty: num('forecast_qty'), confirmedOrderQty: num('confirmed_order_qty'), demandBasisQty: num('demand_basis_qty'), availableInventory: num('available_inventory'), scheduledReceipt: num('scheduled_receipt'), safetyStock: num('safety_stock'), effectiveLeadtime: num('effective_leadtime'), stockoutDate: x.stockout_date ? String(x.stockout_date) : null, safetyBufferDays: num('safety_buffer_days'), requiredQty: num('required_qty'), moq: num('moq'), packSize: num('pack_size'), recommendedQty: num('recommended_qty'), recommendedOrderDate: x.recommended_order_date ? String(x.recommended_order_date) : null, riskStatus: x.risk_status ? String(x.risk_status) : null, calculationStatus: String(x.calculation_status ?? 'CALCULATION_UNAVAILABLE'), reasonCode: x.reason_code ? String(x.reason_code) : null, calculationTrace: x.calculation_trace ?? null }; }), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '발주 추천 조회에 실패했습니다.' }; } }
