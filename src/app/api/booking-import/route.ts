import { NextResponse } from 'next/server';
import { parseBookingPdf } from '@/lib/booking-import/parse';
import { operatorGuard } from '@/lib/auth';

export const runtime = 'nodejs';
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const unauthorized = operatorGuard(request);
  if (unauthorized) return unauthorized;
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PDF_BYTES + 64 * 1024) return NextResponse.json({ error: 'Il PDF non può superare 10 MB.' }, { status: 413 });

  try {
    const bytes = await readBounded(request, MAX_PDF_BYTES + 64 * 1024);
    const bodyBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer;
    const boundedRequest = new Request(request.url, { method: 'POST', headers: request.headers, body: bodyBuffer });
    const form = await boundedRequest.formData();
    const pdf = form.get('pdf');
    if (!(pdf instanceof File)) return NextResponse.json({ error: 'Carica un file PDF.' }, { status: 400 });
    if (pdf.type !== 'application/pdf' || !pdf.name.toLowerCase().endsWith('.pdf')) return NextResponse.json({ error: 'Sono ammessi solo file PDF.' }, { status: 415 });
    if (pdf.size === 0 || pdf.size > MAX_PDF_BYTES) return NextResponse.json({ error: 'Il PDF deve essere tra 1 byte e 10 MB.' }, { status: 413 });
    const signature = Buffer.from(await pdf.slice(0, 5).arrayBuffer()).toString('ascii');
    if (signature !== '%PDF-') return NextResponse.json({ error: 'Il file non sembra un PDF valido.' }, { status: 415 });
    // v1 keeps the upload in memory only. Storage is added with the Case slice.
    const draft = await parseBookingPdf(Buffer.from(await pdf.arrayBuffer()));
    return NextResponse.json({ draft });
  } catch (error) {
    console.error('booking-import failed', error);
    const status = error instanceof RangeError ? 413 : error instanceof TypeError ? 400 : 502;
    const message = status === 413 ? 'La richiesta supera il limite consentito di 10 MB.' : status === 400 ? 'La richiesta non contiene un PDF valido.' : error instanceof Error ? error.message : 'Parsing non riuscito.';
    return NextResponse.json({ error: message }, { status });
  }
}

async function readBounded(request: Request, limit: number): Promise<Uint8Array> {
  if (!request.body) throw new TypeError('Richiesta senza contenuto.');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RangeError('La richiesta supera il limite consentito.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
