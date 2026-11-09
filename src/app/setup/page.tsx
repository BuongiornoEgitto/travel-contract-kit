import { configDefaults, getConfig, isConfigured, missingConfiguration } from '@/lib/config';
import { readSetupToken, setupTokenMatches } from '@/lib/setup/token';
import { SetupForm } from './setup-form';

export const dynamic = 'force-dynamic';

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (isConfigured()) {
    return (
      <main className="setup">
        <h1>Tutto pronto.</h1>
        <p className="lede">Questa installazione e gia configurata. Per cambiare i dati, modifica il file <code>.env.local</code> nella cartella dell’app.</p>
        {/* A full page load is required: the app answers with 401 and the browser
            only opens its credentials prompt on a document request. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Vai all’app</a>
      </main>
    );
  }

  if (!setupTokenMatches(token)) {
    const tokenExists = Boolean(readSetupToken());
    return (
      <main className="setup">
        <p className="eyebrow">CONFIGURAZIONE</p>
        <h1>Apri il link del terminale.</h1>
        <p className="lede">
          Per motivi di sicurezza la configurazione si apre solo dal link con codice che l’app ha stampato nella finestra del terminale dove hai lanciato <code>npm run dev</code>.
        </p>
        <div className="setup-note">
          <p>Nel terminale cerca il riquadro che dice <strong>Configurazione richiesta</strong> e clicca l’indirizzo che inizia con <code>http://localhost:3000/setup?token=</code> (su Windows tieni premuto Ctrl mentre clicchi, su Mac il tasto Cmd). Puoi anche copiarlo e incollarlo nella barra del browser.</p>
          {!tokenExists ? <p className="error">Non trovo nessun codice attivo. Chiudi l’app nel terminale con Ctrl+C e rilanciala con <code>npm run dev</code>: stampera un link nuovo.</p> : null}
        </div>
      </main>
    );
  }

  const config = getConfig();
  const missing = missingConfiguration(config);

  return (
    <main className="setup">
      <p className="eyebrow">CONFIGURAZIONE GUIDATA</p>
      <h1>Due dati e sei dentro.</h1>
      <p className="lede">
        Compilo io il resto: creo il file di configurazione e preparo le tabelle nel tuo database. Non serve il terminale per nessuno di questi passaggi, e i dati restano su questo computer.
      </p>
      <SetupForm
        token={token ?? ''}
        defaults={{
          databaseUrl: missing.includes('DATABASE_URL') ? '' : config.databaseUrl,
          anthropicApiKey: missing.includes('ANTHROPIC_API_KEY') ? '' : config.anthropicApiKey,
          agencyName: config.agencyName === configDefaults.agencyName ? '' : config.agencyName,
          contractTemplateText: config.contractTemplateText,
        }}
      />
    </main>
  );
}
