import { NextResponse } from 'next/server';
import { parseBookingPdf } from '@/lib/booking-import/parse';

export const runtime = 'nodejs';
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData();
  const pdf = form.get('pdf');
  if (!(pdf instanceof File)) return NextResponse.json({ error: 'Carica un file PDF.' }, { status: 400 });
  if (pdf.type !== 'application/pdf') return NextResponse.json({ error: 'Sono ammessi solo PDF.' }, { status: 415 });
  if (pdf.size === 0 || pdf.size > MAX_PDF_BYTES) return NextResponse.json({ error: 'Il PDF deve essere tra 1 byte e 10 MB.' }, { status: 413 });

  try {
    // v1 keeps the upload in memory only. Storage is added with the Case slice.
    const draft = await parseBookingPdf(Buffer.from(await pdf.arrayBuffer()));
    return NextResponse.json({ draft });
  } catch (error) {
    console.error('booking-import failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Parsing non riuscito.' }, { status: 502 });
  }
}
