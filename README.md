# Contratto in Due Minuti

Applicazione web open source con licenza MIT, da installare e gestire nel
proprio ambiente. Aiuta le agenzie viaggi a trasformare una conferma di
prenotazione PDF in una bozza di dati che una persona può verificare.

Non è un servizio ospitato da noi e non richiede un nostro account. Ogni agenzia
gestisce la propria istanza, il proprio PostgreSQL, la propria chiave Anthropic
e gli eventuali servizi esterni. Non è disponibile un installer desktop.

## Stato del progetto

Il prototipo corrente accetta un PDF, ne estrae una bozza con Anthropic e la
mostra per la revisione. Il file caricato resta in memoria durante
l'elaborazione e non viene archiviato.

Sono presenti lo schema SQL e parti server per creare pratiche e generare link
di conferma con snapshot, scadenza e accettazione. Il flusso completo non è
ancora collegato nell'interfaccia: non presentare la versione corrente come
capace di completare tutta la pratica o inviare messaggi dall'interfaccia. È
presente un endpoint tecnico per produrre un PDF dallo snapshot, ma non è un
flusso di redazione e invio completo. Non è stato misurato un tempo end-to-end;
“Due Minuti” è il nome del progetto, non una prestazione dimostrata.

## Requisiti

- Node.js compatibile con la versione di Next.js usata dal progetto.
- Un database PostgreSQL gestito dall'agenzia.
- Una chiave Anthropic per usare l'estrazione AI.

Per lo sviluppo non serve Docker. Puoi usare il PostgreSQL che già gestisci,
oppure un servizio esterno scelto e pagato direttamente dalla tua agenzia.

## Avvio locale

1. Crea un database PostgreSQL vuoto dedicato a questa applicazione. Non
   riutilizzare credenziali o database di `gestionale-bge` o di altri sistemi.
2. Copia `.env.example` in `.env.local` e imposta `DATABASE_URL` con la stringa
   di connessione a quel database. Inserisci anche `ANTHROPIC_API_KEY` per
   provare l'estrazione. Imposta `OPERATOR_PASSWORD` su una password privata.
3. Applica il bootstrap SQL una sola volta al database vuoto:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
   ```

4. Installa le dipendenze e avvia l'app:

   ```bash
   npm install
   npm run dev
   ```

   Apri `http://localhost:3000`. Per l'accesso operatore, il browser chiederà
   le credenziali Basic con nome utente `operator` e la password impostata in
   `OPERATOR_PASSWORD`.

`db/init.sql` è un bootstrap iniziale, non un sistema di migrazioni. Non
riapplicarlo a un database esistente senza aver prima verificato l'impatto.
Per esporre l'app fuori dal computer locale, configura HTTPS, rete, backup,
aggiornamenti e segreti nell'infrastruttura che gestisci.

## Configurazione

I nomi di configurazione sono elencati in `.env.example`. I valori `S3_*` sono
segnaposto per una futura integrazione: in questa versione i PDF non vengono
salvati su storage S3.

Next.js carica i file `.env*` dalla cartella principale del progetto. Mantieni
segreti e valori personali in `.env.local`, che non va aggiunto al repository.
Le variabili senza prefisso `NEXT_PUBLIC_` devono restare lato server. Consulta
la guida ufficiale [Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
e la guida [Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting) per
la configurazione Next.js nel tuo ambiente.

## Licenza e responsabilità

Il codice è distribuito con licenza [MIT](LICENSE). L'esempio tecnico non è
consulenza legale: ogni agenzia è responsabile dei propri testi contrattuali,
della loro revisione e della gestione dei dati dei clienti.
