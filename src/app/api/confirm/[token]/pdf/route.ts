import { readConfirmationPdf } from '@/lib/case';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const pdf = await readConfirmationPdf(token);
    if (!pdf) return new Response('Documento non disponibile.', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="contratto.pdf"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Documento non disponibile.', { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
