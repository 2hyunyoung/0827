import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { parseImportFile } from '@/lib/import/parse';
import { inferMapping } from '@/lib/import/schema';
import { stageImport } from '@/lib/import/repository';
import type { ImportMode, ImportType } from '@/lib/import/types';
export async function POST(request: Request) { try { await requireAdmin(); const form = await request.formData(); const file = form.get('file'); const importType = String(form.get('importType') ?? '') as ImportType; const importMode = String(form.get('importMode') ?? 'append') as ImportMode; if (!(file instanceof File)) throw new Error('FILE_REQUIRED'); const parsed = await parseImportFile(file.name, Buffer.from(await file.arrayBuffer())); const mappingValue = String(form.get('mapping') ?? ''); const mapping = mappingValue ? JSON.parse(mappingValue) : inferMapping(parsed.headers, importType); const staged = await stageImport({ fileName: file.name, importType, importMode, mapping, rows: parsed.rows }); return NextResponse.json({ batchId: staged.batchId, headers: parsed.headers, mapping, preview: parsed.rows.slice(0, 20), summary: staged.validation.summary, status: staged.validation.summary.errorRows ? 'VALIDATION_FAILED' : 'VALIDATED' }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'IMPORT_PREVIEW_FAILED' }, { status: 400 }); } }

