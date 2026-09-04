import test from 'node:test';
import assert from 'node:assert/strict';
import { agentTools, type AgentTool } from './tools.ts';

const required = ['itemCode'];

test('Agent Tool 이름은 유일하고 네 개다', () => {
  assert.equal(agentTools.length, 4);
  assert.equal(new Set(agentTools.map((tool) => tool.name)).size, 4);
  assert.deepEqual(agentTools.map((tool) => tool.name), [
    'getShipmentTrend', 'getDemandProfile', 'getOlAccuracy', 'getBomRequirement',
  ]);
});

test('각 Tool은 한국어 설명, 역할, strict parameters schema, run을 가진다', () => {
  for (const tool of agentTools as AgentTool[]) {
    assert.ok(tool.description.length > 0);
    assert.ok(tool.roles.length > 0);
    assert.equal(tool.parameters.type, 'object');
    assert.equal(tool.parameters.additionalProperties, false);
    assert.ok(Array.isArray(tool.parameters.required));
    assert.equal(typeof tool.run, 'function');
  }
  assert.deepEqual(agentTools.find((tool) => tool.name === 'getShipmentTrend')?.parameters.required, required);
  assert.deepEqual(agentTools.find((tool) => tool.name === 'getDemandProfile')?.parameters.required, required);
  assert.deepEqual(agentTools.find((tool) => tool.name === 'getOlAccuracy')?.parameters.required, ['modelBase', 'fy']);
  assert.deepEqual(agentTools.find((tool) => tool.name === 'getBomRequirement')?.parameters.required, ['modelBase']);
});

test('없는 품목은 ToolResult의 null data와 사유를 반환한다', async () => {
  const tool = agentTools.find((item) => item.name === 'getShipmentTrend');
  assert.ok(tool);
  const result = await tool.run({});
  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.reason, 'ITEM_CODE_REQUIRED');
  assert.deepEqual(result.numbers, {});
});

test('계산 불가 수요 프로파일은 null 수치와 사유를 보존한다', async () => {
  const tool = agentTools.find((item) => item.name === 'getDemandProfile');
  assert.ok(tool);
  const result = await tool.run({});
  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.reason, 'ITEM_CODE_REQUIRED');
});
