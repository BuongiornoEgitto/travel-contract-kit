# Travel Contract Kit

Un'app web open source per agenzie di viaggio. Carichi il PDF di conferma
prenotazione, controlli i dati estratti, salvi la pratica e il pagamento, poi
generi un PDF riepilogativo del contratto e un link di conferma per il cliente.

L'app e self-hosted: ogni agenzia usa il proprio database PostgreSQL e la
propria chiave API Anthropic. Non gira sui nostri server e non invia messaggi
al posto tuo: il link al cliente lo condividi tu.

## Cosa ti serve prima

Due account, che crei dal browser. Nient'altro.

1. **Un database PostgreSQL vuoto**, dedicato solo a questa app. Va bene uno
   gratuito su [Neon](https://neon.com): crea un progetto e copia la stringa
   che ti mostra alla voce *Connection string*. Non riusare il database o le
   credenziali di un'altra applicazione.
2. **Una chiave API Anthropic** da
   [console.anthropic.com](https://console.anthropic.com/settings/keys), con un
   po' di credito sull'account. La lettura dei PDF di prenotazione la paghi tu.

## Installazione

Installa [Node.js](https://nodejs.org) (versione LTS), scarica questo
repository dal pulsante verde **Code** su GitHub e **Download ZIP**, poi
estrailo. Apri un terminale dentro la cartella estratta e lancia due comandi:

```bash
npm install
npm run dev
```

Al primo avvio il terminale stampa un link tipo
`http://localhost:3000/setup?token=...`. Aprilo (su Windows e Linux Ctrl+clic,
su Mac Cmd+clic, oppure copialo e incollalo nel browser). Si apre una pagina
guidata che ti chiede i due dati qui sopra e una password che scegli tu: poi
scrive la configurazione e crea da sola le tabelle nel tuo database. Nessun
file da modificare, nessuna console SQL, nessun bisogno di installare `psql`
o `git`.

Alla fine apri `http://localhost:3000` ed entra con utente `operator` e la tua
password.

**Come apri un terminale nella cartella:** su Windows, tasto destro sulla
cartella e "Apri nel terminale", oppure apri PowerShell dal menu Start e
scrivi `cd` seguito dal percorso della cartella. Su Mac, tasto destro sulla
cartella nel Finder, voce Servizi, poi "Nuovo Terminale nella cartella". Su
Linux, tasto destro dentro la cartella e "Apri nel terminale".

### Farlo fare a un agente AI

Se preferisci, apri un agente di coding (Claude Code, Cursor, Codex, ...) in
una cartella vuota e incollagli questo testo:

```text
Voglio installare e avviare sul mio computer l'app open source
"Travel Contract Kit" da https://github.com/BuongiornoEgitto/travel-contract-kit

Fai tu tutti i passaggi, spiegandomi in italiano semplice cosa stai facendo:

1. Verifica che Node.js e npm siano installati; se mancano, guidami a installarli.
2. Scarica il repository e leggi README.md e AGENTS.md.
3. Esegui npm install e poi npm run dev.
4. Mostrami il link http://localhost:3000/setup?token=... che l'app stampa nel
   terminale e dimmi di aprirlo nel browser.

La pagina di configurazione la compilo io, perche chiede la connection string
del mio database e la mia chiave API. Non chiedermi di incollarle in chat, non
creare ne modificare tu il file .env.local, non pubblicare niente online e non
fare deploy.
```

Su Windows conviene usare **Cursor**: e un'app con interfaccia grafica, scrivi
in una casella di chat e non apri mai il terminale.

### Configurare a mano

La pagina guidata e opzionale. Puoi creare tu `.env.local` partendo da
`.env.example`, impostare `DATABASE_URL`, `ANTHROPIC_API_KEY`, `APP_URL` e una
`OPERATOR_PASSWORD` privata di almeno 12 caratteri, e applicare una sola volta
`db/init.sql` al database vuoto, dalla console SQL del tuo provider oppure con
`psql`:

```bash
export DATABASE_URL='postgresql://UTENTE:PASSWORD@HOST:5432/DATABASE'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
```

Su Windows, in PowerShell, la prima riga diventa `$env:DATABASE_URL='...'` e
`psql` va installato a parte. Questo e un setup iniziale del database, non un
sistema di migrazioni.

**Attenzione su Windows:** Blocco note nasconde le estensioni e salvando crea
`.env.local.txt`, che l'app non legge. E uno dei motivi per cui conviene usare
la pagina guidata.

## Riavviare l'app in futuro

`npm run dev` nella stessa cartella. L'app legge `.env.local` e parte
direttamente dalla richiesta di password. Per cambiare un dato in seguito,
modifica `.env.local`: la pagina guidata si chiude da sola una volta che l'app
e configurata.

Per un uso in produzione: `npm run build` e poi `npm start`.

Vedi [docs/architecture.md](docs/architecture.md) per il flusso dei dati,
[la guida completa](launch/guida-completa-repository-video.md) per una demo
passo-passo e [AGENTS.md](AGENTS.md) per le istruzioni agli agenti di coding.

## Privacy e responsabilita

Usa un database che controlli tu. I PDF di prenotazione vengono elaborati in
memoria e non salvati; il PDF del contratto generato e i dati della pratica
sono salvati nel tuo database PostgreSQL. Le tue credenziali restano nel file
`.env.local` sul tuo computer, escluso da Git. La bozza prodotta dall'AI deve
essere sempre rivista da una persona. Il testo di contratto di esempio non e
consulenza legale: ogni agenzia e responsabile del proprio contratto e dei
dati dei propri clienti.

## Licenza

MIT. Vedi [LICENSE](LICENSE).
