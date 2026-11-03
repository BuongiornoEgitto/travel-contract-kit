import Anthropic from '@anthropic-ai/sdk';
import { bookingDraftSchema, type BookingDraft } from './schema';

const MAX_OUTPUT_TOKENS = 4_096;
const PROMPT = `Leggi questa conferma di prenotazione di un Tour Operator italiano.
Restituisci SOLO JSON valido, senza markdown, in questa forma:
{
  "operatorName": { "value": string|null, "confidence": number 0..100 },
  "operatorReference": { "value": string|null, "confidence": number 0..100 },
  "tripDescription": { "value": string|null, "confidence": number 0..100 },
  "departureDate": { "value": "YYYY-MM-DD"|null, "confidence": number 0..100 },
  "returnDate": { "value": "YYYY-MM-DD"|null, "confidence": number 0..100 },
  "travellers": [{ "fullName": { "value": string|null, "confidence": number }, "birthDate": { "value": "YYYY-MM-DD"|null, "confidence": number } }],
  "totalCents": { "value": integer|null, "confidence": number 0..100 }
}
Non inventare dati. totalCents è il totale in centesimi di euro. Una confidence sotto 90 significa che l'operatore deve controllare il campo.`;

export async function parseBookingPdf(pdf: Buffer): Promise<BookingDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Configura ANTHROPIC_API_KEY nella tua installazione prima di usare il parser.');

  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64') } }, { type: 'text', text: PROMPT }] }],
  });
  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('Il modello non ha restituito un risultato testuale.');

  try {
    return bookingDraftSchema.parse(JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')));
  } catch (error) {
    throw new Error(`Il risultato AI non è una bozza valida: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
  }
}
