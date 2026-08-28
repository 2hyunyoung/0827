'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function saveLeadtimePolicy(formData: FormData) {
  await requireAdmin();
  const supplierId = String(formData.get('supplier_id') || '').trim();
  const raw = String(formData.get('planned_lead_time') || '').trim();
  const plannedLeadTime = raw === '' ? null : Number(raw);
  if (!supplierId || (plannedLeadTime !== null && (!Number.isInteger(plannedLeadTime) || plannedLeadTime < 0))) throw new Error('Lead Time은 0 이상의 정수여야 합니다.');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema('core').from('leadtime_plan').upsert({ supplier_id: supplierId, planned_lead_time: plannedLeadTime, basis: 'ADMIN_CONFIRMED', confirmed_reason: String(formData.get('confirmed_reason') || '').trim() || null, confirmed_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/scm-policies/lead-time');
  revalidatePath('/analysis/stockout');
  revalidatePath('/analysis/inventory-projection');
}
