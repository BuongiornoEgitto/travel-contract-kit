import { Pool } from 'pg';
import { getConfig } from '../config';

let pool: { connectionString: string; instance: Pool } | undefined;

/**
 * Create the pool only when a request needs the database, so build/typegen work
 * offline. The pool is keyed by connection string so a configuration change
 * does not keep serving a stale connection.
 */
export function getDb(): Pool {
  const { databaseUrl } = getConfig();
  if (!databaseUrl) throw new Error('DATABASE_URL è obbligatorio.');
  if (pool && pool.connectionString !== databaseUrl) {
    void pool.instance.end().catch(() => undefined);
    pool = undefined;
  }
  pool ??= { connectionString: databaseUrl, instance: new Pool({ connectionString: databaseUrl, max: 5 }) };
  return pool.instance;
}
