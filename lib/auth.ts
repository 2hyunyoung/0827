import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AppRole = 'ADMIN' | 'USER';
export type AppUser = { user_id: string; email: string; name: string; department: string; role: AppRole; active: boolean; last_login_at: string | null };

export async function getRole(): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.schema('core').from('app_user').select('role, active').eq('user_id', user.id).maybeSingle();
  if (!data?.active || (data.role !== 'ADMIN' && data.role !== 'USER')) return null;
  return data.role;
}

export async function requireUser(): Promise<AppUser> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase.schema('core').from('app_user').select('user_id, email, name, department, role, active, last_login_at').eq('user_id', user.id).maybeSingle();
  if (error || !data || !data.active) redirect('/login?error=inactive');
  return data as AppUser;
}

export async function requireAdmin(): Promise<AppUser> {
  const appUser = await requireUser();
  if (appUser.role !== 'ADMIN') redirect('/forbidden');
  return appUser;
}
