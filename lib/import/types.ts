export type ImportType = 'shipment_log' | 'usage_history' | 'inventory' | 'item_master' | 'supplier_master' | 'purchase_order' | 'goods_receipt' | 'sales_order' | 'business_event' | 'item_substitute';
export type ImportMode = 'append' | 'upsert' | 'replace';
export type ValidationStatus = 'PENDING' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type Severity = 'WARNING' | 'ERROR';
export type RawRow = Record<string, string | null>;
export type ColumnMapping = Record<string, string>;
export type ValidationIssue = { rowNumber: number; fieldName?: string; errorCode: string; errorMessage: string; severity: Severity; originalValue?: string | null };
export type ValidationRow = { rowNumber: number; original: RawRow; mapped: RawRow; status: ValidationStatus; issues: ValidationIssue[] };
export type ValidationSummary = { totalRows: number; successRows: number; warningRows: number; errorRows: number };
export type ValidationResult = { rows: ValidationRow[]; issues: ValidationIssue[]; summary: ValidationSummary };
export type ImportDefinition = { label: string; targetTable: string; required: string[]; aliases: Record<string, string[]>; numeric: string[]; dates: string[]; key: string[] };

