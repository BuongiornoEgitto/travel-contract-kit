'use client';

import { useState, type FormEvent } from 'react';

type Defaults = { databaseUrl: string; anthropicApiKey: string; agencyName: string; contractTemplateText: string };
type Result = { schemaCreated: boolean; warnings: string[] };

export function SetupForm({ token, defaults }: { token: string; defaults: Defaults }) {
  const [databaseUrl, setDatabaseUrl] = useState(defaults.databaseUrl);
  const [anthropicApiKey, setAnthropicApiKey] = useState(defaults.anthropicApiKey);
  const [operatorPassword, setOperatorPassword] = useState('');
  const [agencyName, setAgencyName] = useState(defaults.agencyName);
  const [contractTemplateText, setContractTemplateText] = useState(defaults.contractTemplateText);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStep('Verifico il database e preparo le tabelle, puo richiedere una ventina di secondi.');
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, databaseUrl, anthropicApiKey, operatorPassword, agencyName, contractTemplateText, appUrl: window.location.origin }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; schemaCreated?: boolean; warnings?: string[]; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? 'Configurazione non riuscita.');
      setResult({ schemaCreated: Boolean(body.schemaCreated), warnings: body.warnings ?? [] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Configurazione non riuscita.');
    } finally {
      setStep(null);
    }
  }

  if (result) {
    return (
      <div className="setup-done">
        <h2>Configurazione completata.</h2>
        <ul>
          <li>Credenziali salvate nel file <code>.env.local</code>, sul tuo computer.</li>
          <li>{result.schemaCreated ? 'Tabelle create nel tuo database.' : 'Tabelle del database verificate.'}</li>
        </ul>
        {result.warnings.map((warning) => (
          <p className="setup-warning" key={warning}>{warning}</p>
        ))}
        <p>
          Entra nell’app con utente <strong>operator</strong> e la password che hai appena scelto. Il browser te le chiedera una volta.
        </p>
        {/* A full page load is required: the app answers with 401 and the browser
            only opens its credentials prompt on a document request. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="setup-cta" href="/">Entra nell’app</a>
      </div>
    );
  }

  const busy = step !== null;

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>1. Il tuo database</legend>
        <p className="setup-help">
          Serve un database PostgreSQL vuoto, dedicato solo a questa app. Se non ne hai uno, creane uno gratuito su{' '}
          <a href="https://neon.com" target="_blank" rel="noreferrer noopener">neon.com</a>: crea un progetto e copia la stringa che ti mostra alla voce <em>Connection string</em>.
        </p>
        <label>
          Connection string
          <input
            name="databaseUrl"
            value={databaseUrl}
            onChange={(event) => setDatabaseUrl(event.target.value)}
            placeholder="postgresql://utente:password@host/nome_database?sslmode=require"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>2. La tua chiave AI</legend>
        <p className="setup-help">
          Serve a leggere i PDF di prenotazione. Creala su{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer noopener">console.anthropic.com</a> alla voce API keys, dopo aver caricato un po’ di credito. Resta sul tuo computer: i consumi sono sul tuo account.
        </p>
        <label>
          Chiave API Anthropic
          <input
            name="anthropicApiKey"
            type="password"
            value={anthropicApiKey}
            onChange={(event) => setAnthropicApiKey(event.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>3. La password per entrare</legend>
        <p className="setup-help">La scegli tu adesso e la userai ogni volta che apri l’app, con utente <strong>operator</strong>. Almeno 12 caratteri.</p>
        <label>
          Password operatore
          <input
            name="operatorPassword"
            type="password"
            value={operatorPassword}
            onChange={(event) => setOperatorPassword(event.target.value)}
            minLength={12}
            autoComplete="new-password"
            required
          />
        </label>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>4. La tua agenzia (modificabile dopo)</legend>
        <label>
          Nome agenzia
          <input name="agencyName" value={agencyName} onChange={(event) => setAgencyName(event.target.value)} placeholder="Agenzia Viaggi" required />
        </label>
        <label>
          Testo di contratto predefinito
          <textarea name="contractTemplateText" value={contractTemplateText} onChange={(event) => setContractTemplateText(event.target.value)} required />
        </label>
        <p className="setup-help">Questo testo e un esempio, non consulenza legale: sostituiscilo con le condizioni della tua agenzia.</p>
      </fieldset>

      {error ? <p className="error">{error}</p> : null}
      {step ? <p className="setup-step">{step}</p> : null}
      <button type="submit" disabled={busy}>{busy ? 'Configurazione in corso...' : 'Completa la configurazione'}</button>
    </form>
  );
}
