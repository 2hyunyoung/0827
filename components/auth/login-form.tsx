'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function authMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('email not confirmed')) return '이메일 인증이 완료되지 않았습니다. Supabase Authentication에서 사용자를 확인 처리해주세요.';
  if (normalized.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (normalized.includes('rate limit')) return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
  return `로그인 실패: ${message}`;
}

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        if ((result.error ?? '').toLowerCase().includes('fetch failed')) {
          const { error: browserError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
          if (!browserError) {
            const next = params.get('next') || '/';
            window.location.assign(next.startsWith('/') ? next : '/');
            return;
          }
          setError(authMessage(browserError.message));
          return;
        }
        setError(authMessage(result.error ?? '로그인 요청에 실패했습니다.')); return;
      }
      const next = params.get('next') || '/';
      window.location.assign(next.startsWith('/') ? next : '/');
    } catch { setError('로그인 요청에 실패했습니다. Supabase 연결 상태를 확인해주세요.'); }
    finally { setLoading(false); }
  }
  return <form className="form-stack" onSubmit={onSubmit}><label>이메일<input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>비밀번호<input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="text-danger" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={loading}>{loading ? '로그인 중…' : '로그인'}</button></form>;
}
