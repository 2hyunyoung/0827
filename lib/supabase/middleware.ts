import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { requireSupabaseEnv } from './env';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { url, publishableKey } = requireSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => cookiesToSet.forEach(({ name, value, options }) => { response.cookies.set(name, value, options); }),
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && (path === '/' || path.startsWith('/analysis') || path.startsWith('/workflow') || path.startsWith('/admin'))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(loginUrl);
  }
  if (user && path.startsWith('/admin')) {
    const { data } = await supabase.schema('core').from('app_user').select('role, active').eq('user_id', user.id).maybeSingle();
    if (!data?.active) return NextResponse.json({ error: 'inactive_user' }, { status: 403 });
    if (data.role !== 'ADMIN') return NextResponse.json({ error: 'admin_required' }, { status: 403 });
  }
  return response;
}
