import { z } from 'zod';
import { getDb } from './db/client';
import { createContractSnapshot, type ContractSnapshot } from './contract/snapshot';
import { renderContractPdf } from './contract/pdf';

const date = z.iso.date();
const travellerSchema = z.object({ fullName: z.string().trim().min(1).max(200), birthDate: date.nullable() });
const createCaseSchema = z.object({
  clientName: z.string().trim().min(1).max(200), email: z.email().max(320).or(z.literal('')).default(''),
  clientPhone: z.string().trim().max(50).default(''), agencyName: z.string().trim().min(1).max(200),
  templateText: z.string().trim().min(1).max(8000), operatorName: z.string().trim().min(1).max(200),
  operatorReference: z.string().trim().max(200).default(''), tripDescription: z.string().trim().min(1).max(2000),
  departureDate: date, returnDate: date, travellers: z.array(travellerSchema).min(1).max(30),
  totalCents: z.number().int().nonnegative().max(2_000_000_000), receivedCents: z.number().int().nonnegative().max(2_000_000_000),
}).refine((data) => data.returnDate >= data.departureDate, { path: ['returnDate'], message: 'Il rientro deve essere successivo alla partenza.' })
  .refine((data) => data.receivedCents <= data.totalCents, { path: ['receivedCents'], message: 'L’incasso non può superare il totale.' });
export type NewCase = z.input<typeof createCaseSchema>;

export async function createCase(input: unknown): Promise<{ id: string }> {
  const data = createCaseSchema.parse(input);
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const customer = await client.query<{ id: string }>('INSERT INTO clients (full_name, email, phone) VALUES ($1, NULLIF($2, \'\'), NULLIF($3, \'\')) RETURNING id', [data.clientName, data.email, data.clientPhone]);
    const result = await client.query<{ id: string }>(`INSERT INTO cases
      (client_id, operator_name, operator_reference, agency_name, contract_template_text, trip_description, departure_date, return_date, travellers, total_cents, received_cents)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) RETURNING id`,
      [customer.rows[0].id, data.operatorName, data.operatorReference, data.agencyName, data.templateText, data.tripDescription, data.departureDate, data.returnDate, JSON.stringify(data.travellers), data.totalCents, data.receivedCents]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export async function createConfirmation(caseId: string): Promise<{ token: string; fingerprint: string }> {
  if (!z.uuid().safeParse(caseId).success) throw new Error('Pratica non valida.');
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ client_name: string; email: string | null; phone: string | null; operator_name: string; operator_reference: string; agency_name: string; contract_template_text: string; trip_description: string; departure_date: Date; return_date: Date; travellers: unknown; total_cents: number; received_cents: number }>(`SELECT cl.full_name AS client_name, cl.email, cl.phone, c.operator_name, c.operator_reference,
      c.agency_name, c.contract_template_text, c.trip_description, c.departure_date, c.return_date, c.travellers, c.total_cents, c.received_cents
      FROM cases c JOIN clients cl ON cl.id = c.client_id WHERE c.id = $1 FOR UPDATE`, [caseId]);
    const row = result.rows[0];
    if (!row) throw new Error('Pratica non trovata.');
    const snapshot = await createContractSnapshot({
      clientName: row.client_name, clientEmail: row.email, clientPhone: row.phone, operatorName: row.operator_name,
      operatorReference: row.operator_reference, tripDescription: row.trip_description,
      departureDate: toIsoDate(row.departure_date), returnDate: toIsoDate(row.return_date), travellers: row.travellers as ContractSnapshot['travellers'],
      totalCents: row.total_cents, receivedCents: row.received_cents, agencyName: row.agency_name,
      templateText: row.contract_template_text,
      generatedAt: new Date().toISOString(),
    });
    const pdf = renderContractPdf(snapshot);
    await client.query('UPDATE confirmation_requests SET revoked_at = now() WHERE snapshot_id IN (SELECT id FROM contract_snapshots WHERE case_id = $1) AND accepted_at IS NULL AND revoked_at IS NULL', [caseId]);
    const saved = await client.query<{ id: string }>('INSERT INTO contract_snapshots (case_id, payload, fingerprint, pdf) VALUES ($1, $2, $3, $4) RETURNING id', [caseId, snapshot, snapshot.fingerprint, pdf]);
    const request = await client.query<{ token: string }>("INSERT INTO confirmation_requests (snapshot_id, expires_at) VALUES ($1, now() + interval '7 days') RETURNING token", [saved.rows[0].id]);
    await client.query('COMMIT');
    return { token: request.rows[0].token, fingerprint: snapshot.fingerprint };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export async function readConfirmation(token: string) {
  if (!z.uuid().safeParse(token).success) return null;
  const result = await getDb().query<{ payload: ContractSnapshot; expires_at: Date; revoked_at: Date | null; accepted_at: Date | null }>('SELECT s.payload, r.expires_at, r.revoked_at, r.accepted_at FROM confirmation_requests r JOIN contract_snapshots s ON s.id = r.snapshot_id WHERE r.token = $1', [token]);
  return result.rows[0] ?? null;
}

export async function readConfirmationPdf(token: string) {
  if (!z.uuid().safeParse(token).success) return null;
  const result = await getDb().query<{ pdf: Buffer; expires_at: Date; revoked_at: Date | null; accepted_at: Date | null }>('SELECT s.pdf, r.expires_at, r.revoked_at, r.accepted_at FROM confirmation_requests r JOIN contract_snapshots s ON s.id = r.snapshot_id WHERE r.token = $1', [token]);
  const row = result.rows[0];
  if (!row || row.revoked_at || (!row.accepted_at && row.expires_at <= new Date())) return null;
  return row.pdf;
}

export async function acceptConfirmation(token: string, ip: string | null, userAgent: string | null): Promise<boolean> {
  if (!z.uuid().safeParse(token).success) return false;
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ snapshot_id: string }>(`UPDATE confirmation_requests SET accepted_at = now(), accepted_ip = $2, accepted_user_agent = $3
      WHERE token = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() RETURNING snapshot_id`, [token, ip?.slice(0, 100) ?? null, userAgent?.slice(0, 500) ?? null]);
    if (!result.rowCount) { await client.query('ROLLBACK'); return false; }
    await client.query('UPDATE contract_snapshots SET accepted_at = now() WHERE id = $1', [result.rows[0].snapshot_id]);
    await client.query('COMMIT');
    return true;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

function toIsoDate(value: Date): string { return value.toISOString().slice(0, 10); }
