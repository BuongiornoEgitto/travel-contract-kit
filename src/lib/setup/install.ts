import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from 'pg';

/**
 * The wizard performs the two steps that used to require a terminal: proving
 * the database credentials work and applying `db/init.sql`. Everything goes
 * through the `pg` driver, so no `psql` installation is needed on any platform.
 */
const SCHEMA_TABLES = ['clients', 'cases', 'contract_snapshots', 'confirmation_requests'];
const CONNECT_TIMEOUT_MS = 15_000;

export type DatabaseCheck = { ok: true; schemaPresent: boolean } | { ok: false; message: string };

export async function checkDatabase(databaseUrl: string): Promise<DatabaseCheck> {
  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: CONNECT_TIMEOUT_MS, statement_timeout: CONNECT_TIMEOUT_MS });
  try {
    await client.connect();
    const { rows } = await client.query<{ present: string }>(
      'SELECT count(*)::text AS present FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1::text[])',
      [SCHEMA_TABLES],
    );
    return { ok: true, schemaPresent: Number(rows[0]?.present ?? 0) === SCHEMA_TABLES.length };
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function applySchema(databaseUrl: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const sql = readFileSync(join(process.cwd(), 'db', 'init.sql'), 'utf8');
  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: CONNECT_TIMEOUT_MS });
  try {
    await client.connect();
    // PostgreSQL DDL is transactional, so a partial schema never survives a failure.
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    return { ok: true };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    return { ok: false, message: databaseErrorMessage(error) };
  } finally {
    await client.end().catch(() => undefined);
  }
}

function databaseErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'errore sconosciuto';
  if (/self[- ]signed|SSL|sslmode/i.test(raw)) return `${raw}. Molti provider cloud richiedono SSL: aggiungi ?sslmode=require alla fine della connection string.`;
  if (/password authentication failed/i.test(raw)) return 'Utente o password del database non corretti. Ricopia la connection string dal tuo provider.';
  if (/ENOTFOUND|EAI_AGAIN/i.test(raw)) return 'Host del database non raggiungibile. Controlla di aver copiato la connection string per intero.';
  if (/ETIMEDOUT|timeout/i.test(raw)) return 'Il database non ha risposto in tempo. Se e un database gratuito potrebbe essere in pausa: aprilo una volta dal pannello del provider e riprova.';
  if (/does not exist/i.test(raw)) return `${raw}. Crea prima un database vuoto e usa il suo nome nella connection string.`;
  if (/permission denied|must be owner/i.test(raw)) return `${raw}. L'utente del database deve poter creare tabelle ed estensioni.`;
  return raw;
}

export type KeyCheck = { ok: true } | { ok: false; fatal: boolean; message: string };

/** A failed key check only blocks setup when the provider actively rejects the key. */
export async function checkAnthropicKey(apiKey: string): Promise<KeyCheck> {
  try {
    await new Anthropic({ apiKey, timeout: 15_000, maxRetries: 1 }).models.list({ limit: 1 });
    return { ok: true };
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status: unknown }).status) : undefined;
    if (status === 401 || status === 403) return { ok: false, fatal: true, message: 'La chiave API Anthropic e stata rifiutata. Ricopiala da console.anthropic.com.' };
    if (status === 429) return { ok: false, fatal: false, message: 'La chiave e valida ma il provider ha risposto con un limite di richieste.' };
    return { ok: false, fatal: false, message: `Non ho potuto verificare la chiave API adesso (${error instanceof Error ? error.message : 'errore sconosciuto'}). La configurazione e stata salvata: controlla il credito su console.anthropic.com se l'importazione del PDF non funziona.` };
  }
}
