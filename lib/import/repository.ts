import 'server-only';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { IMPORT_DEFINITIONS } from './schema';
import { validateImport, type ValidationReferences } from './validate';
import type { ColumnMapping, ImportMode, ImportType, RawRow, ValidationResult } from './types';

const demandTypes = new Set<ImportType>(['usage_history', 'sales_order', 'business_event']);
const tableColumns: Record<ImportType, Record<string, string>> = {
  shipment_log: { shipment_id: 'shipment_id', item_id: 'item_id', ship_date: 'ship_date', qty: 'qty' }, usage_history: { usage_id: 'usage_id', item_id: 'item_id', use_date: 'use_date', qty: 'qty', warehouse: 'warehouse', note: 'note' },
  inventory: { item_id: '품목코드', warehouse: '창고', current_stock: '현재고', base_date: '기준일자', safety_stock: '안전재고' }, item_master: { item_id: '품목코드', item_name: '품목명', item_type: '품목구분', unit: '단위', unit_price: '표준단가', is_active: '사용여부', supplier_id: 'supplier_id' },
  supplier_master: { supplier_id: '공급업체코드', supplier_name: '공급업체명', country: '국가', standard_lead_time: '표준리드타임(일)', contact: '담당자', is_active: '사용여부' }, purchase_order: { po_no: '발주번호', order_date: '발주일', supplier_id: '공급업체', item_id: '품목코드', order_qty: '발주수량', unit_price: '단가', due_date: '납기예정일', ordered_by: '발주담당' },
  goods_receipt: { receipt_no: '입고번호', po_no: '발주번호', item_id: '품목코드', receipt_qty: '입고수량', receipt_date: '입고일', warehouse: '입고창고' }, sales_order: { sales_order_id: 'sales_order_id', order_date: 'order_date', customer_id: 'customer_id', item_id: 'item_id', quantity: 'quantity', status: 'status', expected_delivery_date: 'expected_delivery_date' }, business_event: { business_event_id: 'business_event_id', event_type: 'event_type', event_date: 'event_date', item_id: 'item_id', qty: 'qty', description: 'description' }, item_substitute: { item_substitute_id: 'item_substitute_id', item_id: 'item_id', substitute_item_id: 'substitute_item_id', conversion_rate: 'conversion_rate', priority: 'priority', active: 'active' },
};

function rawRecord(type: ImportType, row: RawRow, batchId: string, rowNumber: number): Record<string, unknown> {
  const result: Record<string, unknown> = { batch_id: batchId, source_type: 'FILE_UPLOAD', loaded_at: new Date().toISOString(), source_record_id: `${batchId}:${rowNumber}` };
  for (const [logical, physical] of Object.entries(tableColumns[type])) if (row[logical] !== null && row[logical] !== undefined) result[physical] = row[logical];
  return result;
}

async function references(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<ValidationReferences> {
  const [items, suppliers] = await Promise.all([
    supabase.schema('raw').from('item_master').select('품목코드'),
    supabase.schema('raw').from('supplier_master').select('공급업체코드'),
  ]);
  const itemRows = (items.data ?? []) as unknown as Record<string, unknown>[]; const supplierRows = (suppliers.data ?? []) as unknown as Record<string, unknown>[];
  return { itemIds: new Set(itemRows.map((row) => String(row['품목코드'] ?? ''))), supplierIds: new Set(supplierRows.map((row) => String(row['공급업체코드'] ?? ''))) };
}

export async function stageImport(input: { fileName: string; importType: ImportType; importMode: ImportMode; mapping: ColumnMapping; rows: RawRow[] }): Promise<{ batchId: string; validation: ValidationResult }> {
  const user = await requireAdmin(); const supabase = await createSupabaseServerClient(); const result = validateImport(input.importType, input.rows, input.mapping, input.importMode, await references(supabase));
  const { data: batch, error } = await supabase.schema('core').from('upload_batch').insert({ file_name: input.fileName, import_type: input.importType, import_mode: input.importMode, mapping: input.mapping, total_rows: result.summary.totalRows, success_rows: result.summary.successRows, warning_rows: result.summary.warningRows, error_rows: result.summary.errorRows, status: result.summary.errorRows ? 'VALIDATION_FAILED' : 'VALIDATED', uploaded_by: user.user_id }).select('batch_id').single();
  if (error || !batch) throw new Error(error?.message ?? 'BATCH_CREATE_FAILED');
  const batchId = String(batch.batch_id);
  const staging = result.rows.map((row) => ({ batch_id: batchId, row_number: row.rowNumber, original_record: row.original, mapped_record: row.mapped, validation_status: row.status }));
  if (staging.length) { const { error: stagingError } = await supabase.schema('core').from('import_staging').insert(staging); if (stagingError) throw new Error(stagingError.message); }
  if (result.issues.length) { const { error: issueError } = await supabase.schema('core').from('validation_error').insert(result.issues.map((issue) => ({ batch_id: batchId, row_number: issue.rowNumber, field_name: issue.fieldName ?? null, error_code: issue.errorCode, error_message: issue.errorMessage, severity: issue.severity, original_value: issue.originalValue ?? null }))); if (issueError) throw new Error(issueError.message); }
  if (input.mapping && Object.keys(input.mapping).length) await supabase.schema('core').from('column_mapping').upsert(Object.entries(input.mapping).map(([target, source]) => ({ import_type: input.importType, source_column: source, target_column: target, created_by: user.user_id })), { onConflict: 'import_type,source_column' });
  return { batchId, validation: result };
}

export async function executeImport(batchId: string, confirmReplace = false) {
  const user = await requireAdmin(); const supabase = await createSupabaseServerClient(); const { data: batch, error } = await supabase.schema('core').from('upload_batch').select('*').eq('batch_id', batchId).single();
  if (error || !batch) throw new Error('BATCH_NOT_FOUND'); if (batch.status !== 'VALIDATED' || batch.error_rows > 0) throw new Error('VALIDATION_REQUIRED'); if (batch.import_mode === 'replace' && !confirmReplace) throw new Error('REPLACE_CONFIRMATION_REQUIRED');
  const type = batch.import_type as ImportType; if (batch.import_mode === 'replace') { const { error: replaceError } = await supabase.schema('core').rpc('replace_import_target', { p_import_type: type }); if (replaceError) throw new Error(replaceError.message); }
  const { data: rows, error: rowError } = await supabase.schema('core').from('import_staging').select('row_number,mapped_record').eq('batch_id', batchId).eq('validation_status', 'SUCCESS').order('row_number'); if (rowError) throw new Error(rowError.message);
  const records = (rows ?? []).map((row) => rawRecord(type, row.mapped_record as RawRow, batchId, row.row_number)); const target = IMPORT_DEFINITIONS[type].targetTable;
  for (let index = 0; index < records.length; index += 500) { const chunk = records.slice(index, index + 500); const response = batch.import_mode === 'upsert' ? await supabase.schema('raw').from(target).upsert(chunk, { onConflict: 'source_type,source_record_id' }) : await supabase.schema('raw').from(target).insert(chunk); if (response.error) throw new Error(response.error.message); }
  const stale = demandTypes.has(type); const { error: updateError } = await supabase.schema('core').from('upload_batch').update({ status: 'IMPORTED', imported_at: new Date().toISOString(), rollback_supported: batch.import_mode !== 'replace', forecast_stale: stale }).eq('batch_id', batchId); if (updateError) throw new Error(updateError.message);
  if (stale) await supabase.schema('core').from('forecast_data_state').update({ stale: true, data_snapshot_at: new Date().toISOString(), stale_reason: `파일 적재 batch ${batchId}`, updated_at: new Date().toISOString() }).eq('state_key', 'default');
  void user; return { batchId, importedRows: records.length, rollbackSupported: batch.import_mode !== 'replace', forecastStale: stale };
}

export async function rollbackBatch(batchId: string) { await requireAdmin(); const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('core').rpc('rollback_import_batch', { p_batch_id: batchId }); if (error) throw new Error(error.message); return data; }
