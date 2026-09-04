import { cannotAnswer, parseAgentAnswer, type AgentAnswer } from './schema.ts';
import { chatCompletion, type ChatMessage } from './llm.ts';
import { agentTools, type AgentTool, type ToolResult } from './tools.ts';
import { mergeToolNumbers, validateAgentAnswer } from './guardrail.ts';

export type AgentUser = { role: string };
export type AgentRunInput = { question: string; user: AgentUser; history: ChatMessage[] };
export type AgentTrace = { name: string; args: unknown; ok: boolean; ms: number; reason: string | null };
export type AgentRunResult = { answer: AgentAnswer; trace: AgentTrace[]; history: ChatMessage[] };
export type AgentRunOptions = {
  env?: Record<string, string | undefined>;
  fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  tools?: AgentTool[];
  timeoutMs?: number;
};

const MAX_TOOL_LOOPS = 6;
const TOTAL_TIMEOUT_MS = 60_000;

function toolDefinitions(tools: AgentTool[]) {
  return tools.map((tool) => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.parameters } }));
}

function failure(reason: string, trace: AgentTrace[], history: ChatMessage[]): AgentRunResult {
  return { answer: cannotAnswer(reason), trace, history };
}

function validArguments(value: unknown, tool: AgentTool): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const args = value as Record<string, unknown>;
  const schema = tool.parameters;
  if (!schema.required.every((key) => Object.prototype.hasOwnProperty.call(args, key))) return false;
  if (!schema.additionalProperties && Object.keys(args).some((key) => !(key in schema.properties))) return false;
  return Object.entries(args).every(([key, item]) => {
    const expected = schema.properties[key]?.type;
    if (!expected) return true;
    const types = Array.isArray(expected) ? expected : [expected];
    return types.some((type) => type === 'null' ? item === null : type === 'array' ? Array.isArray(item) : typeof item === type);
  });
}

function toolMessage(callId: string, result: ToolResult | { ok: false; reason: string }): ChatMessage {
  return { role: 'tool', tool_call_id: callId, content: JSON.stringify(result) };
}

export async function runAgent(input: AgentRunInput, options: AgentRunOptions = {}): Promise<AgentRunResult> {
  const availableTools = options.tools ?? agentTools;
  const allowedTools = availableTools.filter((tool) => tool.roles.includes(input.user.role));
  const trace: AgentTrace[] = [];
  const history: ChatMessage[] = [...input.history, { role: 'user', content: input.question }];
  const startedAt = Date.now();
  const responseFormat = { type: 'json_object' };
  const allowedNumbers: Record<string, number> = {};

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop += 1) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= TOTAL_TIMEOUT_MS) return failure('ORCHESTRATOR_TIMEOUT', trace, history);
    const llm = await chatCompletion({ messages: history, tools: toolDefinitions(allowedTools), tool_choice: 'auto', temperature: 0, response_format: responseFormat }, { env: options.env, fetch: options.fetch, timeoutMs: Math.max(1, Math.min(options.timeoutMs ?? TOTAL_TIMEOUT_MS, TOTAL_TIMEOUT_MS - elapsed)) });
    if (llm.error) return failure(`LLM_${llm.error}`, trace, history);
    if (!llm.message) return failure('LLM_EMPTY_MESSAGE', trace, history);
    history.push(llm.message);
    if (!llm.toolCalls.length) {
      const answer = parseAgentAnswer(llm.content ?? '');
      const checked = validateAgentAnswer(answer, allowedNumbers);
      if (checked.ok) return { answer, trace, history };
      const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt);
      if (remaining <= 0) return failure('GUARDRAIL_FAILED', trace, history);
      history.push({ role: 'user', content: `숫자 검증 실패(${checked.reason}). 출처 없는 숫자를 제거하거나 Tool 근거에 맞춰 한 번만 다시 답변하세요.` });
      const regenerated = await chatCompletion({ messages: history, tools: [], tool_choice: 'none', temperature: 0, response_format: responseFormat }, { env: options.env, fetch: options.fetch, timeoutMs: remaining });
      if (regenerated.error || !regenerated.message || regenerated.toolCalls.length > 0) return failure('GUARDRAIL_FAILED', trace, history);
      history.push(regenerated.message);
      const regeneratedAnswer = parseAgentAnswer(regenerated.content ?? '');
      return validateAgentAnswer(regeneratedAnswer, allowedNumbers).ok
        ? { answer: regeneratedAnswer, trace, history }
        : failure('GUARDRAIL_FAILED', trace, history);
    }
    for (const call of llm.toolCalls) {
      const startedTool = Date.now();
      let args: unknown;
      try { args = JSON.parse(call.function.arguments); } catch {
        const reason = 'INVALID_TOOL_ARGUMENTS';
        trace.push({ name: call.function.name, args: call.function.arguments, ok: false, ms: Date.now() - startedTool, reason });
        history.push(toolMessage(call.id, { ok: false, reason }));
        return failure(reason, trace, history);
      }
      const tool = availableTools.find((candidate) => candidate.name === call.function.name);
      if (!tool || !tool.roles.includes(input.user.role)) {
        const reason = 'TOOL_NOT_ALLOWED';
        trace.push({ name: call.function.name, args, ok: false, ms: Date.now() - startedTool, reason });
        history.push(toolMessage(call.id, { ok: false, reason }));
        return failure(reason, trace, history);
      }
      if (!validArguments(args, tool)) {
        const reason = 'INVALID_TOOL_ARGUMENTS';
        trace.push({ name: call.function.name, args, ok: false, ms: Date.now() - startedTool, reason });
        history.push(toolMessage(call.id, { ok: false, reason }));
        return failure(reason, trace, history);
      }
      let result: ToolResult;
      const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt);
      if (remaining <= 0) {
        result = { ok: false, data: null, numbers: {}, dataAsOf: null, reason: 'ORCHESTRATOR_TIMEOUT' };
      } else {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          result = await Promise.race([
            tool.run(args),
            new Promise<ToolResult>((resolve) => { timer = setTimeout(() => resolve({ ok: false, data: null, numbers: {}, dataAsOf: null, reason: 'ORCHESTRATOR_TIMEOUT' }), remaining); }),
          ]);
        } catch { result = { ok: false, data: null, numbers: {}, dataAsOf: null, reason: 'TOOL_EXECUTION_FAILED' }; }
        if (timer) clearTimeout(timer);
      }
      trace.push({ name: call.function.name, args, ok: result.ok, ms: Date.now() - startedTool, reason: result.reason });
      history.push(toolMessage(call.id, result));
      if (!result.ok) return failure(`TOOL_${result.reason ?? 'FAILED'}`, trace, history);
      mergeToolNumbers(call.function.name, result.numbers, allowedNumbers);
    }
    if (loop + 1 === MAX_TOOL_LOOPS) return failure('TOOL_LOOP_LIMIT', trace, history);
  }
  return failure('TOOL_LOOP_LIMIT', trace, history);
}
