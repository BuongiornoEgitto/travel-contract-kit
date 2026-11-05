import { describe, expect, it } from 'vitest';
import { createContractSnapshot } from './snapshot';
import { renderContractPdf } from './pdf';

describe('contract PDF', () => {
  it('renders the immutable snapshot as a PDF with all key case fields', async () => {
    const snapshot = await createContractSnapshot({
      clientName: 'Anna Rossi', clientEmail: 'anna@example.it', clientPhone: '3331234567', operatorName: 'Tour Italia', operatorReference: 'RIF-42',
      tripDescription: 'Mare in Sicilia', departureDate: '2027-06-01', returnDate: '2027-06-08', travellers: [{ fullName: 'Anna Rossi', birthDate: '1990-02-03' }],
      totalCents: 120000, receivedCents: 30000, agencyName: 'Agenzia Roma', templateText: 'Condizioni da verificare con il Tour Operator.', generatedAt: '2026-11-05T10:00:00.000Z',
    });
    const pdf = renderContractPdf(snapshot).toString('binary');
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain(snapshot.fingerprint);
    expect(pdf).toContain('Tour Italia');
    expect(pdf).toContain('Anna Rossi');
    expect(pdf).toContain('RIF-42');
    expect(pdf.endsWith('%%EOF')).toBe(true);
  });
});
