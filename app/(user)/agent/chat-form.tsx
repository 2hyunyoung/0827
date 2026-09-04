'use client';

import { useState, useTransition } from 'react';
import Badge, { type BadgeStatus } from '@/components/ui/badge';
import Panel from '@/components/ui/panel';
import { askAgent } from './actions';
import { initialAgentState, toAgentUiState, validateQuestion, type AgentUiState } from './state';

const examples = ['602K02693의 최근 출고 추세를 알려줘', 'MDL121의 Sales OL과 SCM OL 정확도를 비교해줘', 'MDL121 한 대 생산에 필요한 BOM을 알려줘', '수요 계산이 불가능한 품목과 이유를 알려줘'];

function verdictStatus(verdict: string): BadgeStatus {
  if (verdict === 'SUPPORTED') return 'SAFE';
  if (verdict === 'PARTIAL') return 'WARNING';
  return 'CALCULATION_UNAVAILABLE';
}

export default function ChatForm({ enabled }: { enabled: boolean }) {
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<AgentUiState>(initialAgentState);
  const [pending, startTransition] = useTransition();
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateQuestion(question);
    if (error) { setState({ ...initialAgentState, status: 'error', error }); return; }
    startTransition(async () => setState(toAgentUiState(await askAgent(question))));
  };
  const answer = state.answer;
  return <div className="section">
    <Panel title="AI Agent" meta="근거 기반 SCM 답변">
      {!enabled && <div className="callout"><strong>AI Agent를 사용할 수 없습니다.</strong><br />서버의 OPENAI 설정이 완료되면 질문을 보낼 수 있습니다.</div>}
      <form className="form-stack" onSubmit={submit}>
        <label htmlFor="agent-question">질문</label>
        <textarea id="agent-question" className="form-input" rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="SCM 데이터에 대해 질문하세요." disabled={!enabled || pending} />
        <div className="button-row"><button className="button primary" type="submit" disabled={!enabled || pending}>{pending ? '분석 중…' : '질문 보내기'}</button><span className="muted">답변은 조회 가능한 근거만 사용합니다.</span></div>
      </form>
      <div className="button-row" aria-label="예시 질문">{examples.map((item) => <button key={item} className="button ghost" type="button" onClick={() => setQuestion(item)} disabled={!enabled || pending}>{item}</button>)}</div>
      {state.error && <p className="text-danger" role="alert">{state.error}</p>}
    </Panel>

    {answer && <Panel title="Structured Answer" meta={<Badge status={verdictStatus(answer.verdict)}>{answer.verdict}</Badge>}>
      <p>{answer.answer}</p>
      {answer.cannot_answer && <div className="callout"><strong>계산 불가</strong><br />{answer.cannot_answer_reason ?? '사유가 제공되지 않았습니다.'}</div>}
      <div className="grid grid-3">
        <div className="card"><span className="metric-label">Risk</span><div className="metric-value"><Badge status={answer.risk ? 'WARNING' : 'CALCULATION_UNAVAILABLE'}>{answer.risk ?? '정보 없음'}</Badge></div></div>
        <div className="card"><span className="metric-label">권고</span><div>{answer.recommended_action ?? '권고 없음'}</div></div>
        <div className="card"><span className="metric-label">데이터 기준시각</span><div>{answer.data_as_of ?? '없음'}</div></div>
      </div>
      <div className="grid grid-3">{answer.evidence.map((item, index) => <div className="card" key={`${item.source}-${index}`}><span className="tag blue">{item.source}</span><p>{item.claim}</p><strong>{item.value === null ? '없음' : String(item.value)}</strong><small className="muted">{item.as_of ?? '기준시각 없음'}</small></div>)}</div>
      <details className="card"><summary>Tool trace ({state.trace.length})</summary><div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Tool</th><th>결과</th><th>ms</th><th>사유</th></tr></thead><tbody>{state.trace.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}</td><td>{item.ok ? '성공' : '실패'}</td><td>{item.ms}</td><td>{item.reason ?? '-'}</td></tr>)}</tbody></table></div></details>
    </Panel>}
  </div>;
}
