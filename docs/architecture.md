# Architettura

## Distribuzione

Contratto in Due Minuti è una web app MIT self-hosted e single-agency. Ogni
agenzia gestisce applicazione, PostgreSQL, credenziali e servizi esterni. Il
progetto non ospita dati o servizi a pagamento e non fornisce un installer
desktop.

## Configurazione

`src/lib/config.ts` è l'unica fonte di lettura della configurazione. Legge
`.env.local` a ogni richiesta, con una cache invalidata dalla data di modifica
del file, e ricade su `process.env` quando il file non esiste: così un
deployment con variabili d'ambiente reali continua a funzionare, mentre in
locale la configurazione salvata viene applicata senza riavviare il server.

`/setup` è la configurazione guidata. È raggiungibile solo finché
`DATABASE_URL`, `ANTHROPIC_API_KEY` o `OPERATOR_PASSWORD` mancano, e solo con
il token monouso che `src/instrumentation.ts` genera all'avvio e stampa nel
terminale dell'operatore; il token viene cancellato a configurazione
completata. `src/app/api/setup` verifica le credenziali del database e la
chiave AI prima di toccare qualsiasi cosa, poi applica `db/init.sql` se le
tabelle mancano e scrive `.env.local` con permessi `600`. Una chiave rifiutata
dal provider blocca il salvataggio; un errore di rete produce solo un avviso.

## Flusso verticale

```text
Anagrafica + configurazione documento
  -> PDF prenotazione -> estrazione proposta -> revisione umana
  -> pratica + Incasso -> PDF immutabile + fingerprint
  -> link cliente -> accettazione monouso -> stato visibile
```

L'estrazione Anthropic produce una proposta modificabile. I dati non vengono
salvati finché l'operatore non li rivede e invia la pratica. Il PDF caricato è
tenuto in memoria durante la richiesta e non archiviato. Il nome dell'agenzia
e il testo del documento possono essere inizializzati da variabili ambiente e
modificati per ogni pratica.

La pratica, i viaggiatori, l'Incasso e i dati di configurazione vengono salvati
in una transazione. La generazione blocca la pratica, crea uno snapshot con
tutti i dati mostrati al cliente, calcola un'impronta SHA-256 e salva il PDF
assieme allo snapshot. Il link UUID ha scadenza di sette giorni. Rigenerare il
documento revoca i link precedenti ancora pendenti. L'accettazione aggiorna in
modo atomico richiesta e snapshot; i successivi invii non possono accettare
di nuovo la stessa richiesta.

## Confini e accessi

- `src/lib/booking-import`: chiamata Anthropic e validazione della bozza.
- `src/app/api/booking-import`: ricezione in streaming con limite di 10 MB,
  validazione del tipo e firma PDF, autenticazione e controllo same-origin.
- `src/lib/case.ts`: validazione, persistenza e transazioni per pratica,
  snapshot, PDF e accettazione.
- `src/lib/contract`: contenuto canonico, fingerprint e generazione PDF.
- `src/app/confirm`: pagina pubblica legata al token, consultazione del PDF e
  Server Action per l'accettazione.
- `db/init.sql`: schema bootstrap PostgreSQL iniziale.
- `src/lib/config.ts`: lettura a runtime e scrittura di `.env.local`.
- `src/lib/setup`: token monouso, verifica di database e chiave, applicazione
  dello schema.
- `src/app/setup` e `src/app/api/setup`: configurazione guidata.

Le pagine operatore sono protette da Basic Auth con la password operatore. Ogni
endpoint di mutazione verifica di nuovo le credenziali e l'origine, perché il
proxy non è l'unico confine di sicurezza. L'accettazione pubblica non richiede
Basic Auth: richiede il token del documento e una richiesta same-origin.

## Persistenza e responsabilità

`DATABASE_URL` deve puntare a un database dedicato gestito dall'agenzia.
`db/init.sql` è destinato una sola volta a un database vuoto; non sono ancora
fornite migrazioni o backup automatici. I PDF contrattuali sono in PostgreSQL
come `bytea`; lo storage `S3_*` non è implementato.

Le chiavi AI, i costi, la rete, TLS, i backup, gli aggiornamenti e i dati
restano sotto il controllo dell'agenzia. Il testo iniziale del contratto è un
esempio tecnico, non consulenza legale o garanzia sui servizi prenotati.
