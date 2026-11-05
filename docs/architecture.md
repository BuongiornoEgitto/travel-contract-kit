# Architettura e stato

## Modello di distribuzione

Contratto in Due Minuti è un'applicazione web open source con licenza MIT,
self-hosted e single-agency. Ogni agenzia gestisce l'app, il database
PostgreSQL, i segreti e gli eventuali servizi esterni. Non esistono un account,
un database o un'infrastruttura a pagamento gestiti dal progetto. Non c'è un
installer desktop.

## Percorso previsto

```text
Anagrafica -> PDF di prenotazione -> bozza da revisionare
-> dati pratica e Incasso -> snapshot contratto
-> link cliente -> conferma
```

Il parser produce una proposta e non deve sostituire la verifica umana. Il
backend contiene funzioni per creare pratiche e link associati a snapshot
immutabili; i link hanno scadenza e possono essere revocati. La UI non collega
ancora tutte queste parti. Esiste un endpoint tecnico che rende un PDF dallo
snapshot, ma l'interfaccia non offre un flusso completo di redazione e invio.

## Componenti attuali

- `src/app/api/booking-import`: riceve PDF fino a 10 MB e restituisce la bozza
  estratta. Il file è tenuto in memoria durante la richiesta, non archiviato.
- `src/lib/booking-import`: chiamata Anthropic e validazione dei dati estratti.
- `src/lib/case.ts`: operazioni server per creare pratiche e link di conferma.
- `src/app/confirm`: pagina pubblica di conferma per un token, senza login.
- `src/lib/contract/pdf.ts`: generazione tecnica di un PDF riepilogativo dallo
  snapshot; non equivale a un modello contrattuale revisionato dall'agenzia.
- `db/init.sql`: schema iniziale PostgreSQL per clienti, pratiche e conferme.

La protezione operatore con `OPERATOR_PASSWORD` è una barriera Basic Auth
minima, non un sistema di account o autorizzazioni multiutente.

## Configurazione e bootstrap

Usa un database PostgreSQL dedicato e configurato dall'agenzia in
`DATABASE_URL`. Applica `db/init.sql` una volta al database vuoto. Non sono
fornite migrazioni né backup automatici. Le variabili `S3_*` presenti in
`.env.example` sono predisposte per un'eventuale integrazione futura; lo
storage dei documenti non è implementato.

## Confini di responsabilità

Le chiavi AI, i costi dei fornitori, la rete, TLS, i backup, gli aggiornamenti
e i dati restano sotto il controllo dell'agenzia. Non inserire dati reali nei
materiali di demo. L'esempio di contratto non è consulenza legale: il testo
deve essere definito e revisionato da chi lo usa.
