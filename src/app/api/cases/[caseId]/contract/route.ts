import { NextResponse } from 'next/server';
import { createConfirmation } from '@/lib/case';
import { operatorGuard } from '@/lib/auth';
import { z } from 'zod';

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const unauthorized = operatorGuard(request);
  if (unauthorized) return unauthorized;
  try {
    const { caseId } = await params;
    if (!z.uuid().safeParse(caseId).success) return NextResponse.json({ error: 'Pratica non valida.' }, { status: 400 });
    const confirmation = await createConfirmation(caseId);
    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    return NextResponse.json({ ...confirmation, url: new URL(`/confirm/${confirmation.token}`, origin).toString(), pdfUrl: `/api/confirm/${confirmation.token}/pdf` }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Generazione non riuscita.' }, { status: 400 }); }
}
