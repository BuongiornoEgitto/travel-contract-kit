import { chmodSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Configuration is read at request time, not only at boot, so the setup wizard
 * can write `.env.local` and have the running app pick it up without a restart.
 * The file wins over `process.env` because it is the value the operator saved
 * last; a hosted deployment without the file still works from real env vars.
 */
export type AppConfig = {
  databaseUrl: string;
  anthropicApiKey: string;
  anthropicModel: string;
  agencyName: string;
  contractTemplateText: string;
  appUrl: string;
  operatorPassword: string;
};

export const PLACEHOLDER_PASSWORD = 'change-this-before-public-use';
export const MIN_PASSWORD_LENGTH = 12;

const DEFAULT_MODEL = 'claude-sonnet-5';
const DEFAULT_AGENCY_NAME = 'Agenzia Viaggi';
const DEFAULT_TEMPLATE_TEXT = 'Riepilogo del viaggio e condizioni definite dall’agenzia. Personalizza questo testo prima di salvare la pratica.';

const KEY_ORDER = [
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'AGENCY_NAME',
  'CONTRACT_TEMPLATE_TEXT',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'APP_URL',
  'OPERATOR_PASSWORD',
] as const;

export function envFilePath(): string {
  return join(process.cwd(), '.env.local');
}

let cache: { mtimeMs: number; size: number; values: Record<string, string> } | null = null;

/** Parse the subset of dotenv syntax this app writes and a person is likely to hand-edit. */
export function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = unquote(rawValue);
  }
  return values;
}

function unquote(rawValue: string): string {
  if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
    return rawValue.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (rawValue.startsWith("'") && rawValue.endsWith("'") && rawValue.length >= 2) return rawValue.slice(1, -1);
  return rawValue.trim();
}

function serializeEnvFile(values: Record<string, string>): string {
  const known = KEY_ORDER.filter((key) => values[key] !== undefined);
  const extra = Object.keys(values).filter((key) => !KEY_ORDER.includes(key as (typeof KEY_ORDER)[number])).sort();
  const lines = [
    '# Scritto dalla configurazione guidata di Travel Contract Kit.',
    '# Contiene credenziali: non condividerlo e non aggiungerlo a Git.',
    '',
    ...[...known, ...extra].map((key) => `${key}=${quote(values[key] ?? '')}`),
  ];
  return `${lines.join('\n')}\n`;
}

function quote(value: string): string {
  if (value === '') return '';
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function fileValues(): Record<string, string> {
  const path = envFilePath();
  try {
    const stat = statSync(path);
    if (cache && cache.mtimeMs === stat.mtimeMs && cache.size === stat.size) return cache.values;
    const values = parseEnvFile(readFileSync(path, 'utf8'));
    cache = { mtimeMs: stat.mtimeMs, size: stat.size, values };
    return values;
  } catch {
    cache = null;
    return {};
  }
}

function read(key: string): string {
  const fromFile = fileValues()[key];
  if (fromFile !== undefined && fromFile !== '') return fromFile;
  return process.env[key]?.trim() ?? '';
}

export function getConfig(): AppConfig {
  return {
    databaseUrl: read('DATABASE_URL'),
    anthropicApiKey: read('ANTHROPIC_API_KEY'),
    anthropicModel: read('ANTHROPIC_MODEL') || DEFAULT_MODEL,
    agencyName: read('AGENCY_NAME') || DEFAULT_AGENCY_NAME,
    contractTemplateText: read('CONTRACT_TEMPLATE_TEXT') || DEFAULT_TEMPLATE_TEXT,
    appUrl: read('APP_URL'),
    operatorPassword: read('OPERATOR_PASSWORD'),
  };
}

export const configDefaults = { agencyName: DEFAULT_AGENCY_NAME, contractTemplateText: DEFAULT_TEMPLATE_TEXT, model: DEFAULT_MODEL };

/** The database URL placeholder in `.env.example` must not count as configured. */
function isRealDatabaseUrl(value: string): boolean {
  return /^postgres(ql)?:\/\//.test(value) && !value.includes('USER:PASSWORD@HOST');
}

export function missingConfiguration(config: AppConfig = getConfig()): string[] {
  const missing: string[] = [];
  if (!isRealDatabaseUrl(config.databaseUrl)) missing.push('DATABASE_URL');
  if (!config.anthropicApiKey) missing.push('ANTHROPIC_API_KEY');
  if (!config.operatorPassword || config.operatorPassword === PLACEHOLDER_PASSWORD || config.operatorPassword.length < MIN_PASSWORD_LENGTH) missing.push('OPERATOR_PASSWORD');
  return missing;
}

export function isConfigured(): boolean {
  return missingConfiguration().length === 0;
}

/** Merge over whatever is already in the file so unrelated keys survive. */
export function writeConfig(updates: Record<string, string>): void {
  const merged = { ...fileValues(), ...updates };
  const path = envFilePath();
  writeFileSync(path, serializeEnvFile(merged), { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    // Windows does not support POSIX modes; the file still lands outside Git.
  }
  cache = null;
}

/** The origin the app should treat as its own when APP_URL is not set. */
export function expectedOrigin(requestUrl: string, forwarded?: { proto?: string | null; host?: string | null }): string {
  const { appUrl } = getConfig();
  if (appUrl) return new URL(appUrl).origin;
  if (forwarded?.host) return `${forwarded.proto ?? 'http'}://${forwarded.host}`;
  return new URL(requestUrl).origin;
}
