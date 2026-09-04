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
  normalizeShipmentTrend,
  normalizeDemandProfileRt,
  normalizeOlAccuracy,
  normalizeOlAccuracyFy,
  normalizeBomRequirement,
  type ShipmentTrend,
  type DemandProfileRt,
  type OlAccuracy,
  type OlAccuracyFy,
  type BomRequirement,
  normalizeShipmentTrendResult,
  normalizeDemandProfileResult,
  normalizeOlAccuracyResult,
  normalizeBomRequirementResult,
  type ShipmentTrendResult,
  type DemandProfileResult,
  type OlAccuracyResult,
  type BomRequirementResult,
} from './scm-model';

async function getDemandProfileLegacy(): Promise<{ rows: SkuDemandProfile[]; error: string | null }> { try { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('analytics').from('v_sku_demand_profile').select('*').order('item_id'); if (error) return { rows: [], error: error.message }; return { rows: (data ?? []).map((row) => normalizeDemandProfile(row as Record<string, unknown>)), error: null }; } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '수요 프로파일 조회에 실패했습니다.' }; } }
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

export async function getShipmentTrend(itemCode: string): Promise<{ rows: ShipmentTrendResult[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_shipment_by_hoc').select('*').eq('item_code', itemCode).order('ym');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeShipmentTrendResult(row as Record<string, unknown>)), error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '출하 Trend 조회에 실패했습니다.' }; }
}

export function getDemandProfile(): Promise<{ rows: SkuDemandProfile[]; error: string | null }>;
export function getDemandProfile(itemCode: string): Promise<{ rows: DemandProfileResult[]; error: string | null }>;
export async function getDemandProfile(itemCode?: string): Promise<{ rows: SkuDemandProfile[] | DemandProfileResult[]; error: string | null }> {
  try {
    if (!itemCode) return getDemandProfileLegacy();
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('raw').from('fact_shipment').select('item_code, ym, qty');
    if (itemCode) query = query.eq('item_code', itemCode);
    const { data, error } = await query.order('ym');
    if (error) return { rows: [], error: error.message };
    const sourceRows = (data ?? []) as Array<Record<string, unknown>>;
    if (!sourceRows.length) return { rows: [], error: null };
    const quantities = sourceRows.map((row) => Number(row.qty)).filter((qty) => Number.isFinite(qty));
    const months = new Set(sourceRows.map((row) => String(row.ym ?? '')));
    const observedMonths = months.size;
    const monthNumbers = Array.from(months).map((month) => { const [year, value] = month.split('-').map(Number); return year * 12 + value; }).filter(Number.isFinite);
    const denseMonths = monthNumbers.length > 1 ? Math.max(...monthNumbers) - Math.min(...monthNumbers) + 1 : observedMonths;
    const mean = quantities.length ? quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length : null;
    const variance = mean && quantities.length > 1 ? quantities.reduce((sum, qty) => sum + (qty - mean) ** 2, 0) / quantities.length : null;
    const cv2 = mean && variance !== null ? variance / (mean ** 2) : null;
    const adi = quantities.length ? denseMonths / quantities.length : null;
    const zeroDemandRate = denseMonths > 0 ? (denseMonths - observedMonths) / denseMonths : null;
    const demandType = observedMonths < 6 || !mean || cv2 === null ? null : ((adi !== null && adi < 1.32 && cv2 < 0.49) ? 'SMOOTH' : (adi !== null && adi >= 1.32 && cv2 < 0.49) ? 'INTERMITTENT' : (adi !== null && adi < 1.32 ? 'ERRATIC' : 'LUMPY'));
    return { rows: [{ itemCode: itemCode ?? String(sourceRows[0].item_code ?? '미정'), observedMonths, adi, cv2, zeroDemandRate, demandType, reason: observedMonths < 6 ? 'INSUFFICIENT_HISTORY' : quantities.length === 0 ? 'NO_USAGE' : null }], error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : '수요 프로파일 조회에 실패했습니다.' }; }
}

export async function getOlAccuracy(modelBase: string, fy?: string): Promise<{ rows: OlAccuracyResult[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('raw').from('fact_mc_plan_actual').select('*').eq('model_base', modelBase);
    if (fy) query = query.eq('fy_sheet', fy);
    const { data, error } = await query.order('ym');
    if (error) return { rows: [], error: error.message };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const scored = rows.filter((row) => row.act !== null && row.act !== undefined).map((row) => ({ sales: Number(row.sales_ol), scm: Number(row.scm_ol), act: Number(row.act) })).filter((row) => Number.isFinite(row.act));
    const denominator = scored.reduce((sum, row) => sum + row.act, 0);
    const reason = !rows.length ? 'MODEL_NOT_FOUND' : !scored.length ? 'NO_SCORABLE_ACTUAL' : denominator === 0 ? 'ZERO_ACT_DENOMINATOR' : null;
    return { rows: [{ modelBase, fy: fy ?? null, salesWape: reason ? null : scored.reduce((sum, row) => sum + Math.abs(row.sales - row.act), 0) / denominator, salesBias: reason ? null : scored.reduce((sum, row) => sum + row.sales - row.act, 0) / denominator, scmWape: reason ? null : scored.reduce((sum, row) => sum + Math.abs(row.scm - row.act), 0) / denominator, scmBias: reason ? null : scored.reduce((sum, row) => sum + row.scm - row.act, 0) / denominator, scoredRows: scored.length, reason }], error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'OL 정확도 조회에 실패했습니다.' }; }
}

export async function getBomRequirement(modelBase: string): Promise<{ rows: BomRequirementResult[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const [mcCap, capOption, bom, optionModel, scc] = await Promise.all([
      supabase.schema('raw').from('bridge_mc_cap').select('*').eq('model_base', modelBase),
      supabase.schema('raw').from('bridge_cap_option').select('*'),
      supabase.schema('raw').from('bridge_bom').select('*').eq('model_base', modelBase),
      supabase.schema('raw').from('bridge_option_model').select('*').eq('model_base', modelBase),
      supabase.schema('raw').from('bridge_scc_config').select('*').eq('model_base', modelBase),
    ]);
    const failure = [mcCap, capOption, bom, optionModel, scc].find((result) => result.error);
    if (failure?.error) return { rows: [], error: failure.error.message };
    const caps = (mcCap.data ?? []) as Array<Record<string, unknown>>;
    const options = (capOption.data ?? []) as Array<Record<string, unknown>>;
    const boms = (bom.data ?? []) as Array<Record<string, unknown>>;
    const commonItems = new Set(((optionModel.data ?? []) as Array<Record<string, unknown>>).filter((row) => String(row.common ?? '').toUpperCase() === 'COMMON' || row.common === true).map((row) => String(row.item_code ?? '')));
    const sccRows = (scc.data ?? []) as Array<Record<string, unknown>>;
    const result: BomRequirementResult[] = [];
    for (const cap of caps) {
      const capItemCode = String(cap.cap_item_code ?? '');
      const linkedOptions = options.filter((row) => String(row.cap_item_code ?? '') === capItemCode && String(row.role ?? '') === 'MUST_OPTION');
      for (const option of linkedOptions.length ? linkedOptions : [{ option_item_code: null, role: null }]) {
        const optionItemCode = option.option_item_code ? String(option.option_item_code) : null;
        const linkedBom = boms.filter((row) => !optionItemCode || String(row.item_code ?? '') === optionItemCode);
        for (const part of linkedBom.length ? linkedBom : [{ item_code: optionItemCode, qty: null }]) result.push(normalizeBomRequirementResult({ model_base: modelBase, cap_item_code: capItemCode, option_item_code: optionItemCode, role: option.role ?? null, item_code: part.item_code, qty: part.qty, common: part.item_code ? commonItems.has(String(part.item_code)) : null }));
      }
      for (const label of sccRows) result.push(normalizeBomRequirementResult({ model_base: modelBase, cap_item_code: capItemCode, scc_label: label.scc_desc ?? label.label ?? label.neutral_desc, item_code: label.scc_item_code ?? label.neutral_item_code, qty: label.qty, common: label.scc_item_code ? commonItems.has(String(label.scc_item_code)) : null }));
    }
    return { rows: result, error: null };
  } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'BOM 소요량 조회에 실패했습니다.' }; }
}
