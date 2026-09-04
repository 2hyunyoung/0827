export type AgentEvidence = {
  source: string;
  claim: string;
  value: string | number | boolean | null;
  as_of: string | null;
};

export type AgentAnswer = {
  answer: string;
  verdict: 'SUPPORTED' | 'PARTIAL' | 'CANNOT_ANSWER';
  evidence: AgentEvidence[];
  data_as_of: string | null;
  risk: string | null;
  recommended_action: string | null;
  cannot_answer: boolean;
  cannot_answer_reason: string | null;
};

export const agentAnswerJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    verdict: { type: 'string', enum: ['SUPPORTED', 'PARTIAL', 'CANNOT_ANSWER'] },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source: { type: 'string' },
          claim: { type: 'string' },
          value: { type: ['string', 'number', 'boolean', 'null'] },
          as_of: { type: ['string', 'null'] },
        },
        required: ['source', 'claim', 'value', 'as_of'],
      },
    },
    data_as_of: { type: ['string', 'null'] },
    risk: { type: ['string', 'null'] },
    recommended_action: { type: ['string', 'null'] },
    cannot_answer: { type: 'boolean' },
    cannot_answer_reason: { type: ['string', 'null'] },
  },
  required: ['answer', 'verdict', 'evidence', 'data_as_of', 'risk', 'recommended_action', 'cannot_answer', 'cannot_answer_reason'],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasAllRequiredFields(value: Record<string, unknown>): boolean {
  return ['answer', 'verdict', 'evidence', 'data_as_of', 'risk', 'recommended_action', 'cannot_answer', 'cannot_answer_reason']
    .every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isEvidence(value: unknown): value is AgentEvidence {
  if (!isRecord(value)) return false;
  if (!Object.keys(value).every((key) => ['source', 'claim', 'value', 'as_of'].includes(key))) return false;
  return typeof value.source === 'string'
    && typeof value.claim === 'string'
    && (typeof value.value === 'string' || typeof value.value === 'number' || typeof value.value === 'boolean' || value.value === null)
    && (typeof value.as_of === 'string' || value.as_of === null);
}

function isAgentAnswer(value: unknown): value is AgentAnswer {
  if (!isRecord(value) || !hasAllRequiredFields(value)) return false;
  if (!Object.keys(value).every((key) => ['answer', 'verdict', 'evidence', 'data_as_of', 'risk', 'recommended_action', 'cannot_answer', 'cannot_answer_reason'].includes(key))) return false;
  return typeof value.answer === 'string'
    && (value.verdict === 'SUPPORTED' || value.verdict === 'PARTIAL' || value.verdict === 'CANNOT_ANSWER')
    && Array.isArray(value.evidence)
    && value.evidence.every(isEvidence)
    && (typeof value.data_as_of === 'string' || value.data_as_of === null)
    && (typeof value.risk === 'string' || value.risk === null)
    && (typeof value.recommended_action === 'string' || value.recommended_action === null)
    && typeof value.cannot_answer === 'boolean'
    && (typeof value.cannot_answer_reason === 'string' || value.cannot_answer_reason === null)
    && (value.cannot_answer === (value.verdict === 'CANNOT_ANSWER'))
    && (!value.cannot_answer || typeof value.cannot_answer_reason === 'string');
}

export function cannotAnswer(reason: string): AgentAnswer {
  return {
    answer: '답변할 수 없습니다.',
    verdict: 'CANNOT_ANSWER',
    evidence: [],
    data_as_of: null,
    risk: null,
    recommended_action: null,
    cannot_answer: true,
    cannot_answer_reason: reason,
  };
}

export function parseAgentAnswer(input: string): AgentAnswer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return cannotAnswer('INVALID_JSON');
  }

  if (!isRecord(parsed)) return cannotAnswer('INVALID_CONTRACT');
  if (!hasAllRequiredFields(parsed)) return cannotAnswer('MISSING_REQUIRED_FIELD');
  return isAgentAnswer(parsed) ? parsed : cannotAnswer('INVALID_CONTRACT');
}
