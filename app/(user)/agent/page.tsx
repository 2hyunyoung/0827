import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import { requireUser } from '@/lib/auth';
import ChatForm from './chat-form';

export default async function AgentPage() {
  const user = await requireUser();
  const enabled = ['OPENAI_BASE_URL', 'OPENAI_API_KEY', 'OPENAI_MODEL'].every((key) => Boolean(process.env[key]?.trim()));
  return <div className="system-shell"><Sidebar role={user.role} /><main className="system-main"><Topbar title="AI Agent" eyebrow="SCM ASSISTANT" /><div className="system-content"><PageHeader title="SCM AI Agent" description="실데이터에 근거한 발주·수요·공급 질문을 확인합니다." /><ChatForm enabled={enabled} /></div></main></div>;
}
