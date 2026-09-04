'use server';

import { requireUser } from '@/lib/auth';
import { cannotAnswer } from '@/lib/agent/schema';
import { runAgent } from '@/lib/agent/orchestrator';
import type { AgentActionResult } from './state';

function hasOpenAiConfig() {
  return ['OPENAI_BASE_URL', 'OPENAI_API_KEY', 'OPENAI_MODEL'].every((key) => Boolean(process.env[key]?.trim()));
}

export async function askAgent(question: string): Promise<AgentActionResult> {
  const user = await requireUser();
  const normalized = question.trim();
  if (!normalized) return { ok: false, error: '질문을 입력해주세요.', answer: null, trace: [] };
  if (!hasOpenAiConfig()) return { ok: false, error: 'AI Agent 설정이 없습니다.', answer: null, trace: [] };

  try {
    const result = await runAgent({ question: normalized, user: { role: user.role }, history: [] });
    return { ok: true, error: null, answer: result.answer, trace: result.trace };
  } catch {
    return { ok: false, error: null, answer: cannotAnswer('AGENT_EXECUTION_FAILED'), trace: [] };
  }
}
