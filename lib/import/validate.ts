import { IMPORT_DEFINITIONS } from './schema.ts';
import type { ColumnMapping, ImportMode, ImportType, RawRow, ValidationIssue, ValidationResult, ValidationRow } from './types.ts';

export type ValidationReferences = { itemIds: Set<string>; supplierIds: Set<string>; existingKeys?: Set<string> };
const empty = (value: string | null | undefined) => value === null || value === undefined || value.trim() === '';
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
export function validateImport(importType: ImportType, rows: RawRow[], mapping: ColumnMapping, mode: ImportMode, references: ValidationReferences): ValidationResult {
  const definition = IMPORT_DEFINITIONS[importType]; const mappedRows = rows.map((row) => Object.fromEntries(Object.entries(mapping).map(([target, source]) => [target, row[source] ?? null])) as RawRow); const seen = new Set<string>(); const result: ValidationRow[] = [];
  mappedRows.forEach((mapped, index) => {
    const rowNumber = index + 2; const issues: ValidationIssue[] = [];
    for (const field of definition.required) if (empty(mapped[field])) issues.push({ rowNumber, fieldName: field, errorCode: 'REQUIRED_VALUE', errorMessage: `${field} 필수값이 없습니다.`, severity: 'ERROR', originalValue: mapped[field] });
    for (const field of definition.numeric) if (!empty(mapped[field]) && !Number.isFinite(Number(mapped[field]))) issues.push({ rowNumber, fieldName: field, errorCode: 'INVALID_NUMBER', errorMessage: `${field} 숫자 형식이 아닙니다.`, severity: 'ERROR', originalValue: mapped[field] });
    for (const field of definition.numeric) if (!empty(mapped[field]) && Number(mapped[field]) < 0) issues.push({ rowNumber, fieldName: field, errorCode: 'NEGATIVE_VALUE', errorMessage: `${field} 음수는 허용되지 않습니다.`, severity: 'ERROR', originalValue: mapped[field] });
    for (const field of definition.dates) if (!empty(mapped[field]) && !validDate(mapped[field]!)) issues.push({ rowNumber, fieldName: field, errorCode: 'INVALID_DATE', errorMessage: `${field} 날짜는 YYYY-MM-DD 형식이어야 합니다.`, severity: 'ERROR', originalValue: mapped[field] });
    const key = definition.key.map((field) => mapped[field] ?? '').join('|'); if (key && seen.has(key)) issues.push({ rowNumber, errorCode: 'DUPLICATE_ROW', errorMessage: '파일 안에서 중복된 키입니다.', severity: 'ERROR' }); if (key) seen.add(key);
    if (references.existingKeys?.has(key)) issues.push({ rowNumber, errorCode: mode === 'upsert' ? 'DUPLICATE_UPSERT' : 'DUPLICATE_EXISTING', errorMessage: mode === 'upsert' ? '기존 데이터를 upsert로 갱신합니다.' : '기존 데이터와 중복됩니다.', severity: mode === 'upsert' ? 'WARNING' : 'ERROR' });
    if (mapped.item_id && importType !== 'item_master' && !references.itemIds.has(mapped.item_id)) issues.push({ rowNumber, fieldName: 'item_id', errorCode: 'ITEM_NOT_FOUND', errorMessage: '품목 마스터에 없는 품목코드입니다.', severity: 'ERROR', originalValue: mapped.item_id });
    if (mapped.substitute_item_id && !references.itemIds.has(mapped.substitute_item_id)) issues.push({ rowNumber, fieldName: 'substitute_item_id', errorCode: 'ITEM_NOT_FOUND', errorMessage: '대체 품목 마스터에 없는 품목코드입니다.', severity: 'ERROR', originalValue: mapped.substitute_item_id });
    if (mapped.supplier_id && importType !== 'supplier_master' && !references.supplierIds.has(mapped.supplier_id)) issues.push({ rowNumber, fieldName: 'supplier_id', errorCode: 'SUPPLIER_NOT_FOUND', errorMessage: '공급처 마스터에 없는 공급처 코드입니다.', severity: 'ERROR', originalValue: mapped.supplier_id });
    const status = issues.some((issue) => issue.severity === 'ERROR') ? 'ERROR' : issues.length ? 'WARNING' : 'SUCCESS'; result.push({ rowNumber, original: rows[index], mapped, status, issues });
  });
  return { rows: result, issues: result.flatMap((row) => row.issues), summary: { totalRows: result.length, successRows: result.filter((row) => row.status === 'SUCCESS').length, warningRows: result.filter((row) => row.status === 'WARNING').length, errorRows: result.filter((row) => row.status === 'ERROR').length } };
}
