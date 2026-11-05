export type ContractTraveller = { fullName: string; birthDate: string | null };
export type ContractData = {
  clientName: string; clientEmail: string | null; clientPhone: string | null; operatorName: string; operatorReference: string;
  tripDescription: string; departureDate: string; returnDate: string; travellers: ContractTraveller[];
  totalCents: number; receivedCents: number; agencyName: string; templateText: string; generatedAt: string;
};
export type ContractSnapshot = ContractData & { fingerprint: string };

/** Immutable content used by both the PDF and its public confirmation link. */
export async function createContractSnapshot(data: ContractData): Promise<ContractSnapshot> {
  assertContractData(data);
  const normalized = { ...data, clientName: data.clientName.trim(), tripDescription: data.tripDescription.trim(), agencyName: data.agencyName.trim(), templateText: data.templateText.trim(), travellers: data.travellers.map((person) => ({ fullName: person.fullName.trim(), birthDate: person.birthDate })) };
  const { generatedAt: _generatedAt, ...signedContent } = normalized;
  const canonical = JSON.stringify(signedContent);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { ...normalized, fingerprint };
}

export function snapshotIsCurrent(snapshot: ContractSnapshot, current: Omit<ContractData, 'generatedAt'>): boolean {
  return snapshot.clientName === current.clientName.trim()
    && snapshot.clientEmail === current.clientEmail && snapshot.clientPhone === current.clientPhone
    && snapshot.operatorName === current.operatorName.trim() && snapshot.operatorReference === current.operatorReference.trim()
    && snapshot.tripDescription === current.tripDescription.trim() && snapshot.departureDate === current.departureDate
    && snapshot.returnDate === current.returnDate && snapshot.totalCents === current.totalCents
    && snapshot.receivedCents === current.receivedCents && snapshot.agencyName === current.agencyName.trim()
    && snapshot.templateText === current.templateText.trim()
    && JSON.stringify(snapshot.travellers) === JSON.stringify(current.travellers.map((person) => ({ fullName: person.fullName.trim(), birthDate: person.birthDate })));
}

function assertContractData(data: ContractData): void {
  if (!data.clientName.trim()) throw new Error("Il nome dell'Anagrafica è obbligatorio.");
  if (!data.operatorName.trim()) throw new Error('Il Tour Operator è obbligatorio.');
  if (!data.tripDescription.trim()) throw new Error('La descrizione del viaggio è obbligatoria.');
  if (!Number.isSafeInteger(data.totalCents) || data.totalCents < 0) throw new Error('Totale non valido.');
  if (!Number.isSafeInteger(data.receivedCents) || data.receivedCents < 0 || data.receivedCents > data.totalCents) throw new Error('Incasso non valido.');
  if (data.returnDate < data.departureDate) throw new Error('Intervallo date non valido.');
  if (!data.travellers.length || data.travellers.some((traveller) => !traveller.fullName.trim())) throw new Error('Controlla i viaggiatori.');
}
