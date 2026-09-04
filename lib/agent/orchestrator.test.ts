import test from 'node:test';
import assert from 'node:assert/strict';
import { runAgent, type AgentRunOptions } from './orchestrator.ts';
import type { AgentTool } from './tools.ts';

const answer = JSON.stringify({ answer: '처리했습니다.', verdict: 'SUPPORTED', evidence: [], data_as_of: null, risk: null, recommended_action: null, cannot_answer: false, cannot_answer_reason: null });

function completion(message: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ choices: [{ message }] }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function fakeTool(name: string, roles = ['PLANNER'], run: AgentTool['run'] = async () => ({ ok: true, data: { qty: 3 }, numbers: { qty: 3 }, dataAsOf: null, reason: null })): AgentTool {
  return { name, description: `${name} 설명`, parameters: { type: 'object', properties: {}, required: [], additionalProperties: false }, roles, run };
}

function options(fetch: NonNullable<AgentRunOptions['fetch']>, tools: AgentTool[]): AgentRunOptions {
  return { env: { OPENAI_BASE_URL: 'https://agent.test', OPENAI_API_KEY: 'key', OPENAI_MODEL: 'model' }, fetch, tools };
}

test('assistant tool_calls 뒤 동일 id의 tool 메시지를 넣고 최종 설명을 받는다', async () => {
  const messages: Record<string, unknown>[][] = [];
  let calls = 0;
  const tool = fakeTool('getStock');
  const result = await runAgent({ question: '재고를 알려줘', user: { role: 'PLANNER' }, history: [] }, options(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    messages.push(body.messages);
    calls += 1;
    return calls === 1
      ? completion({ role: 'assistant', content: null, tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'getStock', arguments: '{}' } }] })
      : completion({ role: 'assistant', content: answer });
  }, [tool]));

  assert.equal(result.answer.verdict, 'SUPPORTED');
  assert.equal(tool.run !== undefined, true);
  assert.equal(messages[1][messages[1].length - 1].role, 'tool');
  assert.equal(messages[1][messages[1].length - 1].tool_call_id, 'call-1');
  assert.equal(messages[1][messages[1].length - 2].role, 'assistant');
  assert.equal(result.trace[0].name, 'getStock');
  assert.equal(result.trace[0].ok, true);
});

test('허용되지 않은 Tool은 실행하지 않고 cannotAnswer로 종료한다', async () => {
  let executed = false;
  const result = await runAgent({ question: '민감한 정보를 보여줘', user: { role: 'VIEWER' }, history: [] }, options(async () => completion({ role: 'assistant', content: null, tool_calls: [{ id: 'call-denied', type: 'function', function: { name: 'getSecret', arguments: '{}' } }] }), [fakeTool('getSecret', ['ADMIN'], async () => { executed = true; return { ok: true, data: {}, numbers: {}, dataAsOf: null, reason: null }; })]));

  assert.equal(executed, false);
  assert.equal(result.answer.cannot_answer, true);
  assert.equal(result.answer.cannot_answer_reason, 'TOOL_NOT_ALLOWED');
  assert.equal(result.trace[0].reason, 'TOOL_NOT_ALLOWED');
});

test('잘못된 arguments는 Tool을 실행하지 않고 cannotAnswer로 종료한다', async () => {
  let executed = false;
  const result = await runAgent({ question: '조회해줘', user: { role: 'PLANNER' }, history: [] }, options(async () => completion({ role: 'assistant', content: null, tool_calls: [{ id: 'call-bad', type: 'function', function: { name: 'getStock', arguments: '{bad' } }] }), [fakeTool('getStock', ['PLANNER'], async () => { executed = true; return { ok: true, data: {}, numbers: {}, dataAsOf: null, reason: null }; })]));

  assert.equal(executed, false);
  assert.equal(result.answer.cannot_answer_reason, 'INVALID_TOOL_ARGUMENTS');
  assert.equal(result.trace[0].reason, 'INVALID_TOOL_ARGUMENTS');
});

test('Tool loop는 최대 6회로 제한한다', async () => {
  let executed = 0;
  const result = await runAgent({ question: '계속 조회해줘', user: { role: 'PLANNER' }, history: [] }, options(async () => completion({ role: 'assistant', content: null, tool_calls: [{ id: `call-${executed}`, type: 'function', function: { name: 'getStock', arguments: '{}' } }] }), [fakeTool('getStock', ['PLANNER'], async () => { executed += 1; return { ok: true, data: {}, numbers: {}, dataAsOf: null, reason: null }; })]));

  assert.equal(executed, 6);
  assert.equal(result.trace.length, 6);
  assert.equal(result.answer.cannot_answer_reason, 'TOOL_LOOP_LIMIT');
});

test('Guardrail 숫자 불일치 시 한 번 재생성하고 허용 숫자를 통과시킨다', async () => {
  let calls = 0;
  const numbered = (qty: number) => JSON.stringify({ answer: `수량은 ${qty}입니다.`, verdict: 'SUPPORTED', evidence: [], data_as_of: null, risk: null, recommended_action: null, cannot_answer: false, cannot_answer_reason: null });
  const result = await runAgent({ question: '수량을 알려줘', user: { role: 'PLANNER' }, history: [] }, options(async () => {
    calls += 1;
    if (calls === 1) return completion({ role: 'assistant', content: null, tool_calls: [{ id: 'call-number', type: 'function', function: { name: 'getStock', arguments: '{}' } }] });
    return completion({ role: 'assistant', content: numbered(calls === 2 ? 4 : 3) });
  }, [fakeTool('getStock')]));

  assert.equal(calls, 3);
  assert.equal(result.answer.cannot_answer, false);
  assert.equal(result.answer.answer, '수량은 3입니다.');
});

test('Guardrail 재생성도 숫자 검증에 실패하면 답변을 폐기한다', async () => {
  let calls = 0;
  const result = await runAgent({ question: '수량을 알려줘', user: { role: 'PLANNER' }, history: [] }, options(async () => {
    calls += 1;
    if (calls === 1) return completion({ role: 'assistant', content: null, tool_calls: [{ id: 'call-number-2', type: 'function', function: { name: 'getStock', arguments: '{}' } }] });
    return completion({ role: 'assistant', content: JSON.stringify({ answer: `수량은 ${calls + 3}입니다.`, verdict: 'SUPPORTED', evidence: [], data_as_of: null, risk: null, recommended_action: null, cannot_answer: false, cannot_answer_reason: null }) });
  }, [fakeTool('getStock')]));

  assert.equal(calls, 3);
  assert.equal(result.answer.cannot_answer, true);
  assert.equal(result.answer.cannot_answer_reason, 'GUARDRAIL_FAILED');
});
