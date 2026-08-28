import test from 'node:test';
import assert from 'node:assert/strict';
import { inferMapping } from './schema.ts';
import { validateImport } from './validate.ts';

test('한국어 헤더를 표준 컬럼으로 추정하고 오류 행을 분리한다', () => {
  const headers = ['품목코드', '출고일', '출고수량'];
  const mapping = inferMapping(headers, 'usage_history');
  const result = validateImport('usage_history', [
    { 품목코드: 'ITEM001', 출고일: '2026-01-01', 출고수량: '3' },
    { 품목코드: 'UNKNOWN', 출고일: '잘못된 날짜', 출고수량: '' },
    { 품목코드: 'ITEM001', 출고일: '2026-01-01', 출고수량: '3' },
  ], mapping, 'append', { itemIds: new Set(['ITEM001']), supplierIds: new Set() });
  assert.equal(result.summary.successRows, 1);
  assert.equal(result.summary.errorRows, 2);
  assert.ok(result.issues.some((issue) => issue.errorCode === 'INVALID_DATE'));
  assert.ok(result.issues.some((issue) => issue.errorCode === 'REQUIRED_VALUE'));
  assert.ok(result.issues.some((issue) => issue.errorCode === 'ITEM_NOT_FOUND'));
  assert.ok(result.issues.some((issue) => issue.errorCode === 'DUPLICATE_ROW'));
});

test('upsert의 기존 키는 경고로 남기고 import 가능하게 한다', () => {
  const result = validateImport('usage_history', [{ item_id: 'ITEM001', use_date: '2026-01-01', qty: '2' }], { item_id: 'item_id', use_date: 'use_date', qty: 'qty' }, 'upsert', { itemIds: new Set(['ITEM001']), supplierIds: new Set(), existingKeys: new Set(['|ITEM001|2026-01-01']) });
  assert.equal(result.summary.warningRows, 1);
  assert.equal(result.summary.errorRows, 0);
  assert.equal(result.issues[0].errorCode, 'DUPLICATE_UPSERT');
});
