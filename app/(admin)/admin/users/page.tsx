import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import { updateUserActive, updateUserRole } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const actor = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: users, error } = await supabase.schema('core').from('app_user').select('user_id, email, name, department, role, active, last_login_at, created_at').order('created_at', { ascending: true });
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="사용자 관리" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="사용자 관리" description="ADMIN만 사용자 권한과 활성 상태를 변경할 수 있습니다." /><Panel title="사용자 목록" meta={`${users?.length ?? 0}명`}>
    {error ? <p className="text-danger">조회에 실패했습니다: {error.message}</p> : !users?.length ? <p className="muted">표시할 사용자가 없습니다.</p> : <div className="ui-data-table-wrap"><table className="ui-data-table"><thead><tr><th>사용자</th><th>부서</th><th>권한</th><th>상태</th><th>권한 변경</th><th>활성 변경</th></tr></thead><tbody>{users.map((user) => { const self = user.user_id === actor.user_id; return <tr key={user.user_id}><td>{user.name || user.email}<br /><small className="muted">{user.email}</small></td><td>{user.department || '—'}</td><td><Badge status={user.role === 'ADMIN' ? 'SAFE' : 'WARNING'}>{user.role}</Badge></td><td><Badge status={user.active ? 'SAFE' : 'CALCULATION_UNAVAILABLE'}>{user.active ? '활성' : '비활성'}</Badge></td><td><form action={updateUserRole} className="button-row"><input type="hidden" name="user_id" value={user.user_id} /><button className="button" name="role" value={user.role === 'ADMIN' ? 'USER' : 'ADMIN'} disabled={self}>{user.role === 'ADMIN' ? 'USER로 변경' : 'ADMIN으로 변경'}</button></form></td><td><form action={updateUserActive}><input type="hidden" name="user_id" value={user.user_id} /><input type="hidden" name="active" value={String(!user.active)} /><button className="button" type="submit" disabled={self}>{user.active ? '비활성화' : '활성화'}</button></form></td></tr>; })}</tbody></table></div>}
  </Panel></div></main></div>;
}
