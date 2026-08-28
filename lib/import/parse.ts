import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { RawRow } from './types';

export async function parseImportFile(fileName: string, buffer: Buffer): Promise<{ headers: string[]; rows: RawRow[] }> {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx')) throw new Error('UNSUPPORTED_FILE_TYPE');
  if (buffer.length > 20 * 1024 * 1024) throw new Error('FILE_TOO_LARGE');
  if (lower.endsWith('.csv')) {
    const parsed = Papa.parse<Record<string, string>>(buffer.toString('utf8'), { header: true, skipEmptyLines: true, transformHeader: (header) => header.trim() });
    if (parsed.errors.length) throw new Error(`CSV_PARSE_ERROR:${parsed.errors[0].message}`);
    const headers = parsed.meta.fields ?? []; const rows = parsed.data.map((row) => Object.fromEntries(headers.map((key) => [key, row[key] === '' ? null : row[key] ?? null])));
    if (!headers.length) throw new Error('MISSING_HEADER'); if (rows.length > 50000) throw new Error('TOO_MANY_ROWS'); return { headers, rows };
  }
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headers = (matrix[0] ?? []).map((value) => String(value).trim()); if (!headers.length || headers.some((header) => !header)) throw new Error('MISSING_HEADER');
  const rows = matrix.slice(1).filter((row) => row.some((value) => String(value).trim() !== '')).map((row) => Object.fromEntries(headers.map((key, index) => [key, row[index] === '' || row[index] === undefined ? null : String(row[index])]))) as RawRow[];
  if (rows.length > 50000) throw new Error('TOO_MANY_ROWS'); return { headers, rows };
}

