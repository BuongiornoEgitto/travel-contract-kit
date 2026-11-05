import { describe, expect, it } from 'vitest';
import { acceptConfirmation, createCase, createConfirmation, readConfirmation, readConfirmationPdf } from './case';

const databaseConfigured = Boolean(process.env.DATABASE_URL);

describe.skipIf(!databaseConfigured)('case persistence and acceptance', () => {
  it('persists an immutable PDF and accepts its link once', async () => {
    const created = await createCase({
      clientName: 'Test Runtime', email: 'runtime@example.test', clientPhone: '', agencyName: 'Agenzia Test', templateText: 'Testo personalizzato di verifica.', operatorName: 'Operatore Test', operatorReference: 'TEST-1',
      tripDescription: 'Soggiorno di prova', departureDate: '2027-07-01', returnDate: '2027-07-08',
      travellers: [{ fullName: 'Test Runtime', birthDate: '1990-01-01' }], totalCents: 100_000, receivedCents: 20_000,
    });
    const { token, fingerprint } = await createConfirmation(created.id);
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect((await readConfirmationPdf(token))?.subarray(0, 5).toString()).toBe('%PDF-');
    const pending = await readConfirmation(token);
    expect(pending?.payload.clientName).toBe('Test Runtime');
    expect(pending?.payload.agencyName).toBe('Agenzia Test');
    expect(pending?.payload.templateText).toBe('Testo personalizzato di verifica.');
    expect(pending?.accepted_at).toBeNull();
    expect(await acceptConfirmation(token, '127.0.0.1', 'Vitest')).toBe(true);
    expect(await acceptConfirmation(token, '127.0.0.1', 'Vitest')).toBe(false);
    expect((await readConfirmation(token))?.accepted_at).toBeInstanceOf(Date);
  });
});
