import { describe, expect, it } from 'vitest';
import { missingConfiguration, parseEnvFile, PLACEHOLDER_PASSWORD, type AppConfig } from './config';

const validConfig: AppConfig = {
  databaseUrl: 'postgresql://user:secret@db.example.com:5432/kit',
  anthropicApiKey: 'sk-ant-test',
  anthropicModel: 'claude-sonnet-5',
  agencyName: 'Agenzia Demo',
  contractTemplateText: 'Condizioni demo.',
  appUrl: 'http://localhost:3000',
  operatorPassword: 'una-password-lunga',
};

describe('parseEnvFile', () => {
  it('reads plain assignments and ignores comments and blank lines', () => {
    const values = parseEnvFile('# commento\n\nDATABASE_URL=postgresql://a:b@c/d\nAGENCY_NAME=Demo\n');
    expect(values).toEqual({ DATABASE_URL: 'postgresql://a:b@c/d', AGENCY_NAME: 'Demo' });
  });

  it('keeps spaces and newlines held in a double-quoted value', () => {
    const values = parseEnvFile('CONTRACT_TEMPLATE_TEXT="Prima riga\\nSeconda riga con spazi"\n');
    expect(values.CONTRACT_TEMPLATE_TEXT).toBe('Prima riga\nSeconda riga con spazi');
  });

  it('accepts files written on Windows and lines prefixed with export', () => {
    const values = parseEnvFile('export DATABASE_URL=postgresql://a:b@c/d\r\nANTHROPIC_API_KEY=sk-ant-1\r\n');
    expect(values).toEqual({ DATABASE_URL: 'postgresql://a:b@c/d', ANTHROPIC_API_KEY: 'sk-ant-1' });
  });

  it('does not treat a password containing = or # as two values', () => {
    const values = parseEnvFile('OPERATOR_PASSWORD="abc=def#ghi"\n');
    expect(values.OPERATOR_PASSWORD).toBe('abc=def#ghi');
  });
});

describe('missingConfiguration', () => {
  it('reports nothing for a complete configuration', () => {
    expect(missingConfiguration(validConfig)).toEqual([]);
  });

  it('rejects the sample connection string shipped in .env.example', () => {
    expect(missingConfiguration({ ...validConfig, databaseUrl: 'postgresql://USER:PASSWORD@HOST:5432/DATABASE' })).toContain('DATABASE_URL');
  });

  it('rejects a non-postgres connection string', () => {
    expect(missingConfiguration({ ...validConfig, databaseUrl: 'mysql://user:secret@host/db' })).toContain('DATABASE_URL');
  });

  it('rejects the placeholder password and anything too short', () => {
    expect(missingConfiguration({ ...validConfig, operatorPassword: PLACEHOLDER_PASSWORD })).toContain('OPERATOR_PASSWORD');
    expect(missingConfiguration({ ...validConfig, operatorPassword: 'corta' })).toContain('OPERATOR_PASSWORD');
  });

  it('reports a missing API key', () => {
    expect(missingConfiguration({ ...validConfig, anthropicApiKey: '' })).toContain('ANTHROPIC_API_KEY');
  });
});
