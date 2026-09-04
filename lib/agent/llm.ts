export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: LlmToolCall[];
};

export type LlmToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type ChatRequest = {
  messages: ChatMessage[];
  tools?: unknown[];
  tool_choice?: 'auto' | 'none' | 'required' | unknown;
  temperature?: number;
  response_format?: unknown;
};

export type ChatResult = {
  message: ChatMessage | null;
  content: string | null;
  toolCalls: LlmToolCall[];
  error: string | null;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type LlmOptions = { env?: Record<string, string | undefined>; fetch?: FetchLike; timeoutMs?: number };

const fallbackUsed = new Set<string>();

function failed(error: string): ChatResult {
  return { message: null, content: null, toolCalls: [], error };
}

function requestBody(request: ChatRequest, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = { model, messages: request.messages };
  if (request.tools !== undefined) body.tools = request.tools;
  if (request.tool_choice !== undefined) body.tool_choice = request.tool_choice;
  if (request.temperature !== undefined) body.temperature = request.temperature;
  if (request.response_format !== undefined) body.response_format = request.response_format;
  return body;
}

function parseResponse(body: unknown): ChatResult {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { choices?: unknown }).choices)) return failed('RESPONSE_PARSE_ERROR');
  const message = (body as { choices: Array<{ message?: unknown }> }).choices[0]?.message;
  if (!message || typeof message !== 'object') return failed('RESPONSE_PARSE_ERROR');
  const raw = message as Record<string, unknown>;
  if (raw.role !== 'assistant' && raw.role !== 'tool' && raw.role !== 'user' && raw.role !== 'system') return failed('MESSAGE_PARSE_ERROR');
  const content = raw.content === null || typeof raw.content === 'string' ? raw.content : null;
  const rawToolCalls = raw.tool_calls;
  const toolCalls: LlmToolCall[] = Array.isArray(rawToolCalls) ? rawToolCalls.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const fn = value.function;
    if (value.type !== 'function' || typeof value.id !== 'string' || !fn || typeof fn !== 'object') return [];
    const functionValue = fn as Record<string, unknown>;
    return typeof functionValue.name === 'string' && typeof functionValue.arguments === 'string'
      ? [{ id: value.id, type: 'function', function: { name: functionValue.name, arguments: functionValue.arguments } }]
      : [];
  }) : [];
  return { message: { role: raw.role, content, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) }, content, toolCalls, error: null };
}

async function send(baseUrl: string, apiKey: string, request: ChatRequest, model: string, fetchImpl: FetchLike, timeoutMs: number): Promise<{ result: ChatResult; status: number | null; body: string }> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody(request, model)),
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) return { result: failed(`HTTP_${response.status}: ${body}`), status: response.status, body };
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { return { result: failed('RESPONSE_JSON_PARSE_ERROR'), status: response.status, body }; }
    return { result: parseResponse(parsed), status: response.status, body };
  } catch (error) {
    return { result: failed(timedOut ? 'TIMEOUT' : `NETWORK_ERROR: ${error instanceof Error ? error.message : '알 수 없는 네트워크 오류'}`), status: null, body: '' };
  } finally { clearTimeout(timer); }
}

export async function chatCompletion(request: ChatRequest, options: LlmOptions = {}): Promise<ChatResult> {
  const env = options.env ?? process.env;
  const baseUrl = env.OPENAI_BASE_URL?.trim();
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim();
  if (!baseUrl) return failed('OPENAI_BASE_URL_REQUIRED');
  if (!apiKey) return failed('OPENAI_API_KEY_REQUIRED');
  if (!model) return failed('OPENAI_MODEL_REQUIRED');
  const fetchImpl = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const first = await send(baseUrl, apiKey, request, model, fetchImpl, timeoutMs);
  if (first.result.error && first.status === 400) {
    const key = `${baseUrl}|${model}`;
    const body = first.body.toLowerCase();
    const temperatureError = body.includes('temperature');
    const schemaError = request.response_format && typeof request.response_format === 'object' && (request.response_format as { type?: unknown }).type === 'json_schema';
    if (!fallbackUsed.has(key) && (temperatureError || schemaError)) {
      fallbackUsed.add(key);
      const fallbackRequest: ChatRequest = { ...request };
      if (temperatureError) delete fallbackRequest.temperature;
      else fallbackRequest.response_format = { type: 'json_object' };
      return (await send(baseUrl, apiKey, fallbackRequest, model, fetchImpl, timeoutMs)).result;
    }
  }
  return first.result;
}
