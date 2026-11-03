import { describe, expect, it } from 'vitest';
import { createContractSnapshot, snapshotIsCurrent } from './snapshot';

const contract = { clientName: '  Anna Rossi ', tripDescription: 'Sharm el Sheikh, 7 notti', totalCents: 180000, receivedCents: 50000, generatedAt: '2026-11-03T10:00:00.000Z' };
describe('contract snapshot', () => {
  it('normalizes signed content and creates a stable fingerprint', async () => {
    const first = await createContractSnapshot(contract);
    const second = await createContractSnapshot({ ...contract, generatedAt: '2026-11-04T10:00:00.000Z' });
    expect(first.clientName).toBe('Anna Rossi');
    expect(first.fingerprint).toBe(second.fingerprint);
  });
  it('marks a snapshot stale when a contractual field changes', async () => {
    const snapshot = await createContractSnapshot(contract);
    expect(snapshotIsCurrent(snapshot, { ...contract, clientName: 'Anna Bianchi' })).toBe(false);
  });
});
