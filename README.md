# Contratto in Due Minuti

Applicazione web open source con licenza MIT, self-hosted per agenzie di
viaggio. Trasforma una conferma PDF di un Tour Operator in una bozza
modificabile, da verificare prima di salvare una pratica e preparare il PDF
da condividere con il cliente.

L'agenzia gestisce la propria installazione, il database PostgreSQL e la
chiave Anthropic. Il progetto non ospita dati, non richiede un account sui
nostri servizi e non offre un installer desktop.

## Flusso disponibile

1. Inserisci i dati dell'agenzia e dell'Anagrafica cliente.
2. Carica una conferma PDF del Tour Operator, fino a 10 MB.
3. Controlla e modifica i dati estratti: operatore, viaggio, date,
   viaggiatori e totale.
4. Registra l'Incasso e salva la pratica.
5. Genera il PDF, controllalo e copia il link per condividerlo con il cliente.
6. Il cliente apre il link, consulta lo stesso PDF e può confermare una volta.

Il parser propone dati e livelli di confidenza; la verifica resta a carico
dell'operatore. Il PDF di prenotazione caricato resta in memoria durante
l'elaborazione e non viene archiviato. La pratica e il PDF contrattuale
generato vengono salvati nel PostgreSQL dell'agenzia. Il link cliente scade
dopo sette giorni; una nuova generazione revoca i link precedenti ancora in
attesa. L'accettazione registrata rimane visibile sul link.

L'app non invia email o messaggi: l'operatore condivide il link usando il
canale scelto dall'agenzia. Il nome dell'agenzia e il testo del documento sono
modificabili per ogni pratica. Le impostazioni in `.env.local` forniscono i
valori iniziali del modulo.

“Due Minuti” è il nome del progetto, non un tempo di completamento misurato.

## Requisiti

- Node.js compatibile con la versione di Next.js del progetto.
- Un database PostgreSQL dedicato e gestito dall'agenzia.
- Una chiave Anthropic per usare l'estrazione AI.

Per lo sviluppo non serve Docker. Puoi usare PostgreSQL già gestito
dall'agenzia o un servizio scelto e pagato direttamente da essa.

## Avvio locale

1. Crea un database PostgreSQL vuoto dedicato all'applicazione. Non riutilizzare
   il database o le credenziali di altri sistemi.
2. Copia `.env.example` in `.env.local`. Imposta `DATABASE_URL`,
   `ANTHROPIC_API_KEY`, una `OPERATOR_PASSWORD` privata e `APP_URL` con
   l'origine pubblica dell'app. Puoi configurare anche `AGENCY_NAME` e
   `CONTRACT_TEMPLATE_TEXT`, che l'operatore potrà poi modificare nella
   singola pratica.
3. Applica il bootstrap una sola volta al database vuoto:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
   ```

4. Installa le dipendenze e avvia:

   ```bash
   npm install
   npm run dev
   ```

   Apri `http://localhost:3000`. Il browser chiederà le credenziali Basic Auth:
   nome utente `operator` e la password impostata in `OPERATOR_PASSWORD`.

`db/init.sql` è il bootstrap iniziale, non un sistema di migrazioni. Usalo
solo su un database vuoto. Prima di esporre l'app su Internet, configura HTTPS,
rete, backup, aggiornamenti e segreti nell'infrastruttura che gestisci.

## Configurazione e dati

Le variabili sono elencate in `.env.example`. Mantieni chiavi e valori personali
in `.env.local`, che non va aggiunto al repository. `S3_*` è predisposto per
un'integrazione futura: i PDF sono conservati nel database, non su S3.

L'accesso operatore usa una singola password Basic Auth; non è un sistema di
account o ruoli. I collegamenti di conferma sono pubblici e protetti da token
casuali, scadenza e accettazione monouso. Usa un'origine `APP_URL` corretta e
HTTPS in un'installazione accessibile dall'esterno.

## Licenza e responsabilità

Il codice è distribuito con licenza [MIT](LICENSE). Il testo iniziale del
documento è un esempio tecnico, non consulenza legale né garanzia sui servizi
prenotati. Ogni agenzia deve definire e far revisionare i propri testi e
gestire correttamente i dati dei clienti.
