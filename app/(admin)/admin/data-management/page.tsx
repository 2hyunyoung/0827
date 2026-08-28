import { requireAdmin } from '@/lib/auth';
import { getImportHistory } from '@/lib/import/history';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import FileUploadPanel from '@/components/import/file-upload-panel';
export const dynamic = 'force-dynamic';
export default async function DataManagementPage() { await requireAdmin(); let history: any[] = []; let error = ''; try { history = await getImportHistory(); } catch (err) { error = err instanceof Error ? err.message : '조회 실패'; } return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Data Management" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="데이터 적재 관리" description="파일을 검증하고 승인된 데이터만 RAW 계층에 적재합니다." /><FileUploadPanel /><div className="section"><Panel title="Import History">{error ? <p className="text-danger">조회에 실패했습니다: {error}</p> : <div className="table-wrap"><table><thead><tr>{['파일명', '타입', '모드', '총 행', '성공', '경고', '오류', '사용자', '시간', '상태'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{history.map((row) => <tr key={row.batch_id}><td>{row.file_name}</td><td>{row.import_type}</td><td>{row.import_mode}</td><td>{row.total_rows}</td><td>{row.success_rows}</td><td>{row.warning_rows}</td><td>{row.error_rows}</td><td>{row.uploaded_by_email ?? '—'}</td><td>{new Date(row.uploaded_at).toLocaleString('ko-KR')}</td><td>{row.status}</td></tr>)}{!history.length && <tr><td colSpan={10} className="muted">적재 이력이 없습니다.</td></tr>}</tbody></table></div>}</Panel></div></div></main></div>; }

