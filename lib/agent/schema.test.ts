import test from 'node:test';
import assert from 'node:assert/strict';
import { agentAnswerJsonSchema, cannotAnswer, parseAgentAnswer } from './schema.ts';

test('잘못된 JSON은 계산 불가 계약으로 변환한다', () => {
  const result = parseAgentAnswer('{invalid json');

  assert.equal(result.verdict, 'CANNOT_ANSWER');
  assert.equal(result.cannot_answer, true);
  assert.equal(result.cannot_answer_reason, 'INVALID_JSON');
});

test('필드가 누락된 응답은 계산 불가 계약으로 변환한다', () => {
  const result = parseAgentAnswer(JSON.stringify({ answer: '답변' }));

  assert.equal(result.verdict, 'CANNOT_ANSWER');
  assert.equal(result.cannot_answer, true);
  assert.equal(result.cannot_answer_reason, 'MISSING_REQUIRED_FIELD');
});

test('계산 불가 응답은 사유를 보존한다', () => {
  const result = parseAgentAnswer(JSON.stringify(cannotAnswer('NO_DATA')));

  assert.equal(result.cannot_answer, true);
  assert.equal(result.cannot_answer_reason, 'NO_DATA');
  assert.deepEqual(result.evidence, []);
});

test('Structured Outputs 스키마는 strict object 계약을 사용한다', () => {
  assert.equal(agentAnswerJsonSchema.type, 'object');
  assert.equal(agentAnswerJsonSchema.additionalProperties, false);
  assert.deepEqual(agentAnswerJsonSchema.required, [
    'answer', 'verdict', 'evidence', 'data_as_of', 'risk',
    'recommended_action', 'cannot_answer', 'cannot_answer_reason',
  ]);
  assert.equal('additionalItems' in agentAnswerJsonSchema.properties.evidence, false);
  assert.equal(agentAnswerJsonSchema.properties.evidence.items.additionalProperties, false);
});
