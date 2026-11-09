import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';

/**
 * The wizard writes credentials to disk, so it cannot be reachable by anyone
 * who merely finds the port. A one-time token is generated at startup and
 * printed in the terminal where the operator started the app; only the holder
 * of that token can run the configuration.
 */
const TOKEN_FILE = () => join(process.cwd(), '.setup-token');

export function ensureSetupToken(): string {
  const existing = readSetupToken();
  if (existing) return existing;
  const token = randomBytes(24).toString('hex');
  const path = TOKEN_FILE();
  writeFileSync(path, `${token}\n`, { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows does not support POSIX modes.
  }
  return token;
}

export function readSetupToken(): string | null {
  try {
    const token = readFileSync(TOKEN_FILE(), 'utf8').trim();
    return token || null;
  } catch {
    return null;
  }
}

export function clearSetupToken(): void {
  try {
    if (existsSync(TOKEN_FILE())) rmSync(TOKEN_FILE());
  } catch {
    // A leftover token is harmless once the app reports itself as configured.
  }
}

export function setupTokenMatches(candidate: string | null | undefined): boolean {
  const expected = readSetupToken();
  if (!expected || !candidate) return false;
  const suppliedBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
