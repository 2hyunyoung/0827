'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (signInError) { setError('이메일 또는 비밀번호를 확인해주세요.'); return; }
      router.replace(params.get('next') || '/'); router.refresh();
    } catch { setError('로그인 요청에 실패했습니다. Supabase 연결 상태를 확인해주세요.'); }
    finally { setLoading(false); }
  }
  return <form className="form-stack" onSubmit={onSubmit}><label>이메일<input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>비밀번호<input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="text-danger" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={loading}>{loading ? '로그인 중…' : '로그인'}</button></form>;
}
