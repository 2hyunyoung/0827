export type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: string | string[]; enum?: string[] }>; 
  required: string[];
  additionalProperties: false;
};

export type ToolResult = {
  ok: boolean;
  data: unknown | null;
  numbers: Record<string, number>;
  dataAsOf: string | null;
  reason: string | null;
};

export type AgentTool = {
  name: string;
  description: string;
  parameters: JsonSchema;
  roles: string[];
  run: (args: Record<string, unknown>) => Promise<ToolResult>;
};

const itemParameters: JsonSchema = { type: 'object', properties: { itemCode: { type: 'string' } }, required: ['itemCode'], additionalProperties: false };
const accuracyParameters: JsonSchema = { type: 'object', properties: { modelBase: { type: 'string' }, fy: { type: ['string', 'null'] } }, required: ['modelBase', 'fy'], additionalProperties: false };
const modelParameters: JsonSchema = { type: 'object', properties: { modelBase: { type: 'string' } }, required: ['modelBase'], additionalProperties: false };

function missingArgument(name: string): ToolResult {
  return { ok: false, data: null, numbers: {}, dataAsOf: null, reason: `${name}_REQUIRED` };
}

function collectNumbers(value: unknown, path = 'data', output: Record<string, number> = {}): Record<string, number> {
  if (typeof value === 'number' && Number.isFinite(value)) output[path] = value;
  else if (Array.isArray(value)) value.forEach((item, index) => collectNumbers(item, `${path}[${index}]`, output));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => collectNumbers(item, path ? `${path}.${key}` : key, output));
  return output;
}

function makeResult(data: unknown, error: string | null): ToolResult {
  if (error) return { ok: false, data: null, numbers: {}, dataAsOf: null, reason: error };
  const rows = Array.isArray(data) ? data : null;
  if (rows && rows.length === 0) return { ok: false, data: null, numbers: {}, dataAsOf: null, reason: 'ITEM_NOT_FOUND' };
  const dataAsOf = rows?.map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>).data_as_of ?? (row as Record<string, unknown>).dataAsOf : null)).find((value): value is string => typeof value === 'string') ?? null;
  const rowReason = rows?.map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>).reason : null)).find((value): value is string => typeof value === 'string') ?? null;
  return { ok: true, data, numbers: collectNumbers(data), dataAsOf, reason: rowReason };
}

export const agentTools: AgentTool[] = [
  {
    name: 'getShipmentTrend',
    description: '품목의 HOC 기준 월별 출고량과 3개월·6개월·12개월 평균, 관측 개월 수, 최근월 출고량을 조회합니다.',
    parameters: itemParameters,
    roles: ['SCM_ANALYST', 'PLANNER'],
    async run(args) {
      const itemCode = typeof args.itemCode === 'string' && args.itemCode.trim() ? args.itemCode : null;
      if (!itemCode) return missingArgument('ITEM_CODE');
      const { getShipmentTrend } = await import('../scm.ts');
      const result = await getShipmentTrend(itemCode);
      return makeResult(result.rows, result.error);
    },
  },
  {
    name: 'getDemandProfile',
    description: '품목의 출하 이력으로 ADI, CV², zero-demand rate와 수요유형을 조회하며 6개월 미만 이력은 추정하지 않습니다.',
    parameters: itemParameters,
    roles: ['SCM_ANALYST', 'PLANNER'],
    async run(args) {
      const itemCode = typeof args.itemCode === 'string' && args.itemCode.trim() ? args.itemCode : null;
      if (!itemCode) return missingArgument('ITEM_CODE');
      const { getDemandProfile } = await import('../scm.ts');
      const result = await getDemandProfile(itemCode);
      return makeResult(result.rows, result.error);
    },
  },
  {
    name: 'getOlAccuracy',
    description: '기종과 회계연도별로 Sales OL과 SCM OL의 WAPE와 Bias를 실제값 기준으로 비교합니다.',
    parameters: accuracyParameters,
    roles: ['SCM_ANALYST', 'MANAGER'],
    async run(args) {
      const modelBase = typeof args.modelBase === 'string' && args.modelBase.trim() ? args.modelBase : null;
      if (!modelBase) return missingArgument('MODEL_BASE');
      const fy = typeof args.fy === 'string' && args.fy.trim() ? args.fy : undefined;
      const { getOlAccuracy } = await import('../scm.ts');
      const result = await getOlAccuracy(modelBase, fy);
      return makeResult(result.rows, result.error);
    },
  },
  {
    name: 'getBomRequirement',
    description: '기종별 CAP, 필수 옵션, SCC·Label, 구성 품목과 수량 및 공용 품목 여부를 조회합니다.',
    parameters: modelParameters,
    roles: ['SCM_ANALYST', 'PLANNER'],
    async run(args) {
      const modelBase = typeof args.modelBase === 'string' && args.modelBase.trim() ? args.modelBase : null;
      if (!modelBase) return missingArgument('MODEL_BASE');
      const { getBomRequirement } = await import('../scm.ts');
      const result = await getBomRequirement(modelBase);
      return makeResult(result.rows, result.error);
    },
  },
];

export const tools = agentTools;
