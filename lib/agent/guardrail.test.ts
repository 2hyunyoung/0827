import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAnswerNumbers, mergeToolNumbers, validateAgentAnswer } from './guardrail.ts';
import type { AgentAnswer } from './schema.ts';

const base: AgentAnswer = { answer: '', verdict: 'SUPPORTED', evidence: [], data_as_of: null, risk: null, recommended_action: null, cannot_answer: false, cannot_answer_reason: null };
const allowed = { 'getShipmentTrend.data[0].qty': 779, 'getOlAccuracy.salesWape': 0.664, 'getOlAccuracy.bias': -0.125 };

test('정상: 천단위 쉼표 숫자를 추출한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, answer: '출고량은 1,234대입니다.' }), [1234]));
test('정상: 소수와 음수를 추출한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, answer: '증감률은 -12.5입니다.' }), [-12.5]));
test('정상: 비율의 백분율 표기를 추출한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, answer: 'WAPE는 66.4%입니다.' }), [{ value: 66.4, isPercent: true }]));
test('정상: evidence의 label/value/reason 숫자를 추출한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, evidence: [{ source: '출하', claim: '수량 779', value: 0.664, as_of: null }], recommended_action: 'P80 2026-07 기준으로 확인' }), [779, 0.664]));
test('정상: 품목코드·기종·P80·연월·날짜·목록 번호를 제외한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, answer: '1. 602K02693, MDL121, P80, 2026-07, 2026-07-31' }), []));
test('정상: null은 숫자 목록에서 제외한다', () => assert.deepEqual(collectAnswerNumbers({ ...base, evidence: [{ source: 'x', claim: '없음', value: null, as_of: null }] }), []));
test('정상: ToolResult numbers를 toolName.key 형태로 합친다', () => assert.deepEqual(mergeToolNumbers('getShipmentTrend', { qty: 779, avg: 0.664 }), { 'getShipmentTrend.qty': 779, 'getShipmentTrend.avg': 0.664 }));
test('정상: 표기 반올림은 허용한다', () => assert.equal(validateAgentAnswer({ ...base, answer: '수량은 779.0입니다.' }, { qty: 779 }).ok, true));
test('정상: 0~1 비율의 % 표기는 허용한다', () => assert.equal(validateAgentAnswer({ ...base, answer: '정확도는 66.4%입니다.' }, { wape: 0.664 }).ok, true));
test('조작: 허용 사전에 없는 정수는 거부한다', () => assert.equal(validateAgentAnswer({ ...base, answer: '수량은 780입니다.' }, { qty: 779 }).ok, false));
test('조작: 허용 사전에 없는 소수는 거부한다', () => assert.equal(validateAgentAnswer({ ...base, answer: 'WAPE는 0.665입니다.' }, { wape: 0.664 }).ok, false));
test('조작: 음수 부호가 다른 값은 거부한다', () => assert.equal(validateAgentAnswer({ ...base, answer: 'Bias는 0.125입니다.' }, { bias: -0.125 }).ok, false));
test('조작: 출처 없는 백분율은 거부한다', () => assert.equal(validateAgentAnswer({ ...base, answer: '정확도는 70%입니다.' }, { wape: 0.664 }).ok, false));
test('조작: recommended_action의 출처 없는 수량은 거부한다', () => assert.equal(validateAgentAnswer({ ...base, recommended_action: '다음 발주량은 999개로 확정합니다.' }, { qty: 779 }).ok, false));

test('조작 숫자 0건: 정상 답변은 모든 숫자가 허용되면 통과한다', () => {
  const result = validateAgentAnswer({ ...base, answer: '출고량 779, WAPE 66.4%, Bias -0.125' }, allowed);
  assert.equal(result.ok, true);
  assert.deepEqual(result.unsupported, []);
});
