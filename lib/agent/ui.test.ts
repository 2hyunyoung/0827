import test from 'node:test';
import assert from 'node:assert/strict';
import { cannotAnswer } from './schema.ts';
import { initialAgentState, toAgentUiState, validateQuestion } from '../../app/(user)/agent/state.ts';

test('빈 질문은 전송 전에 거부한다', () => assert.equal(validateQuestion('  '), '질문을 입력해주세요.'));
test('계산 불가 답변은 사유와 함께 카드 상태로 보존한다', () => {
  const answer = cannotAnswer('INSUFFICIENT_HISTORY');
  const state = toAgentUiState({ ok: true, error: null, answer, trace: [] });
  assert.equal(state.status, 'complete');
  assert.equal(state.answer?.cannot_answer_reason, 'INSUFFICIENT_HISTORY');
});
test('정상 답변은 근거와 trace를 렌더링할 상태로 보존한다', () => {
  const answer = { ...cannotAnswer('x'), answer: '40개월', verdict: 'SUPPORTED' as const, cannot_answer: false, cannot_answer_reason: null, evidence: [{ source: 'v_shipment_by_hoc', claim: '관측 개월', value: 40, as_of: '2026-09' }] };
  const state = toAgentUiState({ ok: true, error: null, answer, trace: [{ name: 'getShipmentTrend', args: { itemCode: '602K02693' }, ok: true, ms: 4, reason: null }] });
  assert.deepEqual(state, { status: 'complete', error: null, answer, trace: [{ name: 'getShipmentTrend', args: { itemCode: '602K02693' }, ok: true, ms: 4, reason: null }] });
  assert.equal(initialAgentState.answer, null);
});
