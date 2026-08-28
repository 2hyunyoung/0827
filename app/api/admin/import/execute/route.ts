import { NextResponse } from 'next/server';
import { executeImport } from '@/lib/import/repository';
export async function POST(request: Request) { try { const body = await request.json(); return NextResponse.json(await executeImport(String(body.batchId), Boolean(body.confirmReplace))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'IMPORT_FAILED' }, { status: 400 }); } }

