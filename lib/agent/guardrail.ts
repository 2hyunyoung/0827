import type { AgentAnswer } from './schema.ts';
import type { ToolResult } from './tools.ts';

export type ExtractedAnswerNumber = number | { value: number; isPercent: true };
export type GuardrailResult = { ok: boolean; extracted: ExtractedAnswerNumber[]; unsupported: number[]; reason: string | null };

const numericToken = /[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?|[-+]?\d+(?:\.\d+)?%?/g;

function isExcluded(text: string, start: number, end: number): boolean {
  const token = text.slice(start, end);
  const before = text[start - 1];
  const after = text[end];
  if (/[A-Za-z0-9]/.test(before ?? '') || /[A-Za-z0-9]/.test(after ?? '')) return true;
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const line = text.slice(lineStart, text.indexOf('\n', start) < 0 ? text.length : text.indexOf('\n', start));
  const prefix = line.match(/^\s*(?:[-*•]|\d+[.)])\s*/)?.[0];
  if (prefix && start - lineStart < prefix.length) return true;
  const surrounding = text.slice(Math.max(0, start - 8), Math.min(text.length, end + 12));
  if (/(?:19|20)\d{2}-\d{1,2}(?:-\d{1,2})?/.test(surrounding)) return true;
  if (/\bP\d+\b/i.test(text.slice(Math.max(0, start - 1), Math.min(text.length, end + 1)))) return true;
  return token.length === 0;
}

function extractTextNumbers(text: string): ExtractedAnswerNumber[] {
  const result: ExtractedAnswerNumber[] = [];
  numericToken.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = numericToken.exec(text)) !== null) {
    const start = match.index;
    const raw = match[0];
    if (isExcluded(text, start, start + raw.length)) continue;
    const isPercent = raw.endsWith('%');
    const value = Number(raw.replace(/,/g, '').replace(/%$/, ''));
    if (Number.isFinite(value)) result.push(isPercent ? { value, isPercent: true } : value);
  }
  return result;
}

export function collectAnswerNumbers(answer: AgentAnswer): ExtractedAnswerNumber[] {
  const result: ExtractedAnswerNumber[] = [];
  for (const field of [answer.answer, answer.verdict, answer.recommended_action]) if (typeof field === 'string') result.push(...extractTextNumbers(field));
  for (const evidence of answer.evidence) {
    const row = evidence as unknown as Record<string, unknown>;
    for (const key of ['label', 'claim', 'reason']) {
      if (typeof row[key] === 'string') result.push(...extractTextNumbers(row[key] as string));
    }
    if (typeof row.value === 'number' && Number.isFinite(row.value)) result.push(row.value);
    else if (typeof row.value === 'string') result.push(...extractTextNumbers(row.value));
  }
  return result;
}

export function mergeToolNumbers(toolName: string, numbers: Record<string, number>, target: Record<string, number> = {}): Record<string, number> {
  for (const [key, value] of Object.entries(numbers)) if (Number.isFinite(value)) target[`${toolName}.${key}`] = value;
  return target;
}

function matchesAllowed(value: number, allowed: number, decimals: number): boolean {
  if (value === allowed) return true;
  const factor = 10 ** Math.min(decimals, 8);
  return Math.round(allowed * factor) / factor === value;
}

export function validateAgentAnswer(answer: AgentAnswer, allowedNumbers: Record<string, number>): GuardrailResult {
  const extracted = collectAnswerNumbers(answer);
  const allowed = Object.values(allowedNumbers).filter((value) => Number.isFinite(value));
  const unsupported: number[] = [];
  for (const item of extracted) {
    const value = typeof item === 'number' ? item : item.value;
    const comparable = typeof item === 'number' ? value : value / 100;
    const decimals = typeof item === 'number' ? ((String(value).split('.')[1] ?? '').length) : ((String(value).split('.')[1] ?? '').length);
    if (!allowed.some((candidate) => matchesAllowed(comparable, candidate, decimals))) unsupported.push(value);
  }
  return { ok: unsupported.length === 0, extracted, unsupported, reason: unsupported.length ? `UNSUPPORTED_NUMBER:${unsupported.join(',')}` : null };
}

export function numbersFromToolResult(toolName: string, result: ToolResult, target: Record<string, number> = {}): Record<string, number> {
  return mergeToolNumbers(toolName, result.numbers, target);
}
