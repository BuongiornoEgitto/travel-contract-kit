export type ContractData = { clientName: string; tripDescription: string; totalCents: number; receivedCents: number; generatedAt: string };
export type ContractSnapshot = ContractData & { fingerprint: string };

/** Immutable content used by both the PDF and its public confirmation link. */
export async function createContractSnapshot(data: ContractData): Promise<ContractSnapshot> {
  assertContractData(data);
  const canonical = JSON.stringify({ clientName: data.clientName.trim(), tripDescription: data.tripDescription.trim(), totalCents: data.totalCents, receivedCents: data.receivedCents });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { ...data, clientName: data.clientName.trim(), tripDescription: data.tripDescription.trim(), fingerprint };
}

export function snapshotIsCurrent(snapshot: ContractSnapshot, current: Omit<ContractData, 'generatedAt'>): boolean {
  return snapshot.clientName === current.clientName.trim() && snapshot.tripDescription === current.tripDescription.trim() && snapshot.totalCents === current.totalCents && snapshot.receivedCents === current.receivedCents;
}

function assertContractData(data: ContractData): void {
  if (!data.clientName.trim()) throw new Error("Il nome dell'Anagrafica è obbligatorio.");
  if (!data.tripDescription.trim()) throw new Error('La descrizione del viaggio è obbligatoria.');
  if (!Number.isSafeInteger(data.totalCents) || data.totalCents < 0) throw new Error('Totale non valido.');
  if (!Number.isSafeInteger(data.receivedCents) || data.receivedCents < 0) throw new Error('Incasso non valido.');
}
