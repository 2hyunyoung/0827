import Link from 'next/link';

export default function LoginPage() {
  return <main className="content"><section className="card" style={{ maxWidth: 420, margin: '80px auto' }}><span className="eyebrow">MONTHLY PROCUREMENT CONTROL</span><h1>로그인</h1><p className="muted">한국후지필름BI 월간 발주계획</p><Link href="/" className="button primary">시스템으로 이동</Link></section></main>;
}
