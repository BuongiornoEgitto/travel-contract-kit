import { NextResponse } from 'next/server';
import { createCase } from '@/lib/case';
import { operatorGuard } from '@/lib/auth';

export async function POST(request: Request) {
  const unauthorized = operatorGuard(request);
  if (unauthorized) return unauthorized;
  try { return NextResponse.json(await createCase(await request.json()), { status: 201 }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Creazione non riuscita.'; return NextResponse.json({ error: message }, { status: message.includes('DATABASE_URL') ? 503 : 400 }); }
}
