import type { AgentAnswer } from '@/lib/agent/schema';
import type { AgentTrace } from '@/lib/agent/orchestrator';

export type AgentActionResult = {
  ok: boolean;
  error: string | null;
  answer: AgentAnswer | null;
  trace: AgentTrace[];
};

export type AgentUiState = {
  status: 'idle' | 'submitting' | 'complete' | 'error';
  error: string | null;
  answer: AgentAnswer | null;
  trace: AgentTrace[];
};

export const initialAgentState: AgentUiState = {
  status: 'idle',
  error: null,
  answer: null,
  trace: [],
};

export function validateQuestion(question: string): string | null {
  return question.trim() ? null : '질문을 입력해주세요.';
}

export function toAgentUiState(result: AgentActionResult): AgentUiState {
  return {
    status: result.ok && result.answer ? 'complete' : 'error',
    error: result.error,
    answer: result.answer,
    trace: result.trace,
  };
}
