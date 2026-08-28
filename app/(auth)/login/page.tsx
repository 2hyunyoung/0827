import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return <main className="content"><section className="card auth-card"><span className="eyebrow">MONTHLY PROCUREMENT CONTROL</span><h1>로그인</h1><p className="muted">한국후지필름BI 월간 발주계획</p><Suspense fallback={<p className="muted">로그인 화면을 준비 중입니다.</p>}><LoginForm /></Suspense></section></main>;
}
