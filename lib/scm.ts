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
} from './scm-model';

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
