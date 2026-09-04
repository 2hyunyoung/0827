import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletion, type ChatRequest } from './llm.ts';

const request: ChatRequest = {
  messages: [{ role: 'user', content: '재고를 알려줘' }],
  tools: [{ type: 'function', function: { name: 'getStock', description: '재고 조회', parameters: { type: 'object' } } }],
  tool_choice: 'auto',
  temperature: 0,
  response_format: { type: 'json_schema', json_schema: { name: 'agent_answer', strict: true, schema: {} } },
};

function response(body: unknown, init: { status?: number; ok?: boolean } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

test('필수 환경변수가 없으면 fetch하지 않고 error를 반환한다', async () => {
  let called = false;
  const result = await chatCompletion(request, { env: {}, fetch: async () => { called = true; return response({}); } });
  assert.equal(called, false);
  assert.equal(result.error, 'OPENAI_BASE_URL_REQUIRED');
});

test('tool_calls를 포함한 응답을 파싱하고 trim한 URL·키를 헤더에 사용한다', async () => {
  let captured: { url?: string; headers?: HeadersInit; body?: string } = {};
  const result = await chatCompletion(request, {
    env: { OPENAI_BASE_URL: ' https://example.test/ ', OPENAI_API_KEY: ' key-1 ', OPENAI_MODEL: ' model-1 ' },
    fetch: async (url, init) => { captured = { url: String(url), headers: init?.headers, body: String(init?.body) }; return response({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'getStock', arguments: '{"itemCode":"A"}' } }] } }] }); },
  });
  assert.equal(result.error, null);
  assert.equal(result.toolCalls[0].function.name, 'getStock');
  assert.equal(captured.url, 'https://example.test/chat/completions');
  assert.equal(new Headers(captured.headers).get('authorization'), 'Bearer key-1');
  assert.equal(JSON.parse(captured.body ?? '{}').model, 'model-1');
});

test('json_schema 400은 json_object로 한 번만 재시도한다', async () => {
  const formats: unknown[] = [];
  const result = await chatCompletion(request, {
    env: { OPENAI_BASE_URL: 'https://fallback-schema.test', OPENAI_API_KEY: 'key', OPENAI_MODEL: 'model-schema' },
    fetch: async (_url, init) => { const body = JSON.parse(String(init?.body)); formats.push(body.response_format); return formats.length === 1 ? new Response('json_schema is not supported', { status: 400 }) : response({ choices: [{ message: { role: 'assistant', content: '{}' } }] }); },
  });
  assert.equal(result.error, null);
  assert.deepEqual(formats.map((item) => (item as { type: string }).type), ['json_schema', 'json_object']);
});

test('temperature 오류 400은 temperature를 빼고 한 번만 재시도한다', async () => {
  const bodies: Record<string, unknown>[] = [];
  const result = await chatCompletion(request, {
    env: { OPENAI_BASE_URL: 'https://fallback-temperature.test', OPENAI_API_KEY: 'key', OPENAI_MODEL: 'model-temperature' },
    fetch: async (_url, init) => { const body = JSON.parse(String(init?.body)); bodies.push(body); return bodies.length === 1 ? new Response("'temperature' does not support 0 with this model", { status: 400 }) : response({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }); },
  });
  assert.equal(result.error, null);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].temperature, 0);
  assert.equal('temperature' in bodies[1], false);
});

test('AbortController timeout은 throw하지 않고 error를 반환한다', async () => {
  const result = await chatCompletion(request, {
    env: { OPENAI_BASE_URL: 'https://timeout.test', OPENAI_API_KEY: 'key', OPENAI_MODEL: 'model-timeout' },
    timeoutMs: 5,
    fetch: (_url, init) => new Promise((_resolve, reject) => { init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); }),
  });
  assert.equal(result.error, 'TIMEOUT');
});
