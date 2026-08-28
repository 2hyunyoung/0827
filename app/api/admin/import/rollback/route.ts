import { NextResponse } from 'next/server';
import { rollbackBatch } from '@/lib/import/repository';
export async function POST(request: Request) { try { const body = await request.json(); return NextResponse.json({ status: await rollbackBatch(String(body.batchId)) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'ROLLBACK_FAILED' }, { status: 400 }); } }

