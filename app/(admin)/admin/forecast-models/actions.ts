'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updateForecastModel(formData: FormData) {
  const actor = await requireAdmin();
  const modelId = String(formData.get('model_id') || '');
  const enabled = String(formData.get('enabled')) === 'true';
  const parametersText = String(formData.get('parameters') || '{}');
  if (!modelId) throw new Error('모델 식별자가 없습니다.');
  let parameters: unknown;
  try { parameters = JSON.parse(parametersText); } catch { throw new Error('parameters는 유효한 JSON이어야 합니다.'); }
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) throw new Error('parameters는 JSON 객체여야 합니다.');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema('core').from('model_config').update({ enabled, parameters, updated_by: actor.user_id, updated_at: new Date().toISOString() }).eq('model_id', modelId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/forecast-models');
}

export async function runBaselineForecast(formData: FormData) {
  await requireAdmin();
  const note = String(formData.get('note') || '').trim() || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('run_baseline_forecast', { p_note: note });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/forecast-runs');
}

export async function runBacktest(formData: FormData) {
  await requireAdmin();
  const runId = String(formData.get('run_id') || '').trim() || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('run_backtest', { p_forecast_run_id: runId });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/forecast-runs');
  revalidatePath('/analysis/model-comparison');
}
