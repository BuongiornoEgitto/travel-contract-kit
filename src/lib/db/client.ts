import { Pool } from 'pg';

let pool: Pool | undefined;

/** Create the pool only when a request needs the database, so build/typegen work offline. */
export function getDb(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL è obbligatorio.');
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}
