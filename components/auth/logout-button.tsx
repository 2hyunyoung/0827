'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() { await createSupabaseBrowserClient().auth.signOut(); router.replace('/login'); router.refresh(); }
  return <button type="button" className="button" onClick={logout}>로그아웃</button>;
}
