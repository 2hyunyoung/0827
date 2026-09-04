import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBomRequirement, normalizeDemandProfileRt, normalizeForecastSettings, normalizeLeadtimeGap, normalizeOlAccuracyFy, normalizeShipmentTrend } from './scm-model.ts';

test('normalizes analytics leadtime rows into the screen model', () => {
  const result = normalizeLeadtimeGap({
    supplier_name: 'Fujifilm BI India',
    country: 'India',
    master_lt: 32,
    sample_count: 159,
    actual_avg: 37.6,
    p80: 44,
    gap: 12,
  });

  assert.deepEqual(result, {
    supplier: 'Fujifilm BI India',
    country: 'India',
    masterLeadTime: 32,
    sampleCount: 159,
    actualAverage: 37.6,
    p80: 44,
    gap: 12,
  });
});

test('uses Korean view aliases and safe defaults', () => {
  const result = normalizeLeadtimeGap({ 법인: 'Japan', 국가: 'Japan', 표준리드타임: 7, 표본수: 278, 실적평균: 14.5, P80: 18, 격차: 11 });
  assert.equal(result.supplier, 'Japan');
  assert.equal(result.masterLeadTime, 7);
  assert.equal(result.p80, 18);
  assert.equal(result.gap, 11);
});

test('reads the real analytics.v_leadtime_gap column names', () => {
  const result = normalizeLeadtimeGap({
    supplier_name: 'Fujifilm BI China',
    country: 'China',
    std_lead_time: 25,
    n_samples: 210,
    mean_days: 28.4,
    p80_days: 33,
    gap_days: 8,
  });

  assert.deepEqual(result, {
    supplier: 'Fujifilm BI China',
    country: 'China',
    masterLeadTime: 25,
    sampleCount: 210,
    actualAverage: 28.4,
    p80: 33,
    gap: 8,
  });
});

test('keeps forecast boundaries configurable and preserves unavailable dates', () => {
  const result = normalizeForecastSettings({
    data_start: '2025-01-01', data_end: '2026-06-30',
    train_start: null, train_end: null, test_start: null, test_end: null,
    train_row_count: 0, test_row_count: 0,
    train_window_ok: false, test_window_ok: false,
    granularity: 'DAILY', policy_values: [], outlier_rules: [], item_policies: [],
  });
  assert.equal(result.trainStart, null);
  assert.equal(result.testEnd, null);
  assert.equal(result.trainWindowOk, false);
  assert.equal(result.granularity, 'DAILY');
});

test('normalizes real-data shipment trend values and keeps missing values null', () => {
  const result = normalizeShipmentTrend({ item_code: '602K02693', shipment_count: 40, shipped_qty: '779.0', received_qty: 772.3, reason_code: null });
  assert.equal(result.itemCode, '602K02693');
  assert.equal(result.shipmentCount, 40);
  assert.equal(result.shippedQty, 779);
  assert.equal(result.receivedQty, 772.3);
  assert.equal(result.reasonCode, null);
  assert.equal(result.period, null);
});

test('normalizes real-data demand, OL accuracy, and BOM rows', () => {
  assert.equal(normalizeDemandProfileRt({ item_code: '602K02693', demand_qty: null, reason_code: 'NO_USAGE' }).demandQty, null);
  assert.deepEqual(normalizeOlAccuracyFy({ fy: 'FY25', sales_wape: 0.664, scm_bias: 0.367 }), {
    fiscalYear: 'FY25', modelBase: null, salesWape: 0.664, scmWape: null, salesBias: null, scmBias: 0.367, reasonCode: null,
  });
  assert.deepEqual(normalizeBomRequirement({ model_base: 'A3', item_code: 'PART-1', qty: 2 }), {
    modelBase: 'A3', itemCode: 'PART-1', itemName: null, bomGroup: null, requirementQty: 2, attachmentRate: null, reasonCode: null,
  });
});
