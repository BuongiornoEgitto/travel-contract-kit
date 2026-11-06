# Guida completa: dal repository al video demo

Questa guida spiega come preparare il progetto, avviare l'applicazione, fare
una prova end-to-end e registrare un video dimostrativo pronto da rivedere.
Si conclude con il file video esportato: non comprende pubblicazione, push del
repository o deploy.

## Cosa serve

- Il repository locale `contratto-in-due-minuti`.
- Node.js e npm, in versioni compatibili con Next.js e il `package.json` del
  progetto.
- Accesso a un database PostgreSQL dedicato a questa app e il comando `psql`,
  oppure la console SQL del servizio PostgreSQL scelto.
- Una chiave Anthropic per il parser. La chiamata può avere un costo sul tuo
  account Anthropic.
- Un PDF demo sintetico o anonimizzato, autorizzato e di massimo 10 MB.
- Un registratore schermo, un microfono e un editor video.

Docker non è necessario. Usa solo un database creato per questa demo; non
riutilizzare credenziali o database di `gestionale-bge` o di altri sistemi.

## 1. Apri e controlla il repository

Apri una finestra Terminale e spostati nella cartella del progetto:

```bash
cd /percorso/del/repository/contratto-in-due-minuti
```

Controlla di essere nella cartella che contiene `package.json`, `README.md` e
`db/init.sql`. Se hai modifiche locali, controlla lo stato prima di fare altre
operazioni e conservale. Questa procedura non richiede un push o una
pubblicazione del repository.

Leggi il [README](../README.md) e questa guida. Le riprese e i testi per il
video sono in [`video/`](video/); la checklist si trova in
[`recording-checklist-it.md`](recording-checklist-it.md).

## 2. Prepara un database demo

1. Crea un database PostgreSQL vuoto dedicato, con un utente che abbia accesso
   solo a quel database.
2. Conserva la stringa di connessione. Avrà una forma simile a
   `postgresql://utente:password@host:5432/nome_database`.
3. Se utilizzi un servizio gestito, applica il contenuto di `db/init.sql` una
   sola volta tramite la sua console SQL. Se hai `psql`, esegui il comando
   indicato al passaggio successivo.

Il file `db/init.sql` inizializza lo schema; non è un sistema di migrazioni.
Usalo solo sul database demo vuoto.

Per usare `psql`, il terminale deve conoscere la URL. `.env.local` viene letto
da Next.js ma non viene caricato automaticamente nella shell. Impostala in
quella finestra di Terminale, sostituendo i valori di esempio:

```bash
export DATABASE_URL='postgresql://UTENTE:PASSWORD@HOST:5432/DATABASE_DEMO'
```

Se non vuoi inserire la URL nella cronologia locale della shell, usa la
console SQL del servizio PostgreSQL.

## 3. Configura l'app senza esporre segreti

Copia il modello di configurazione:

```bash
cp .env.example .env.local
```

Apri `.env.local` nel tuo editor e imposta almeno questi valori:

```dotenv
DATABASE_URL=postgresql://UTENTE:PASSWORD@HOST:5432/DATABASE_DEMO
ANTHROPIC_API_KEY=la-tua-chiave-anthropic
APP_URL=http://localhost:3000
OPERATOR_PASSWORD=una-password-locale-lunga-e-privata
AGENCY_NAME=Agenzia Demo
CONTRACT_TEMPLATE_TEXT=Testo dimostrativo da verificare con l'agenzia.
```

Sostituisci i valori di esempio con quelli tuoi. Non incollare chiavi reali nel
repository, in una registrazione o in chat. Non aggiungere `.env.local` a Git.
`S3_*` non serve per la demo: in questa versione il PDF generato viene salvato
nel database, mentre il PDF caricato è elaborato in memoria.

## 4. Inizializza il database e avvia l'app

Dalla cartella del repository, applica lo schema al database demo:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
```

Se usi la console SQL del provider, apri `db/init.sql`, copia tutto il
contenuto nella console e applicalo al database vuoto.

Installa le dipendenze e avvia Next.js:

```bash
npm install
npm run dev
```

Lascia aperta la finestra del Terminale. Nel browser visita
`http://localhost:3000`. Quando compare la richiesta Basic Auth, usa il nome
utente `operator` e il valore configurato in `OPERATOR_PASSWORD`.

## 5. Prepara i dati fittizi per la demo

Prepara prima di registrare:

- una conferma PDF di prova, sintetica o anonimizzata e autorizzata;
- nome e contatti inventati, per esempio `Anna Rossi` e
  `anna@example.test`;
- dati di viaggio e viaggiatori fittizi coerenti con il PDF;
- importo totale e Incasso di esempio;
- nome agenzia e testo dimostrativo da usare nel documento.

Non riprendere dati reali di clienti, numeri di prenotazione reali, date di
nascita reali, password, chiavi o altre informazioni personali. Il PDF caricato
non viene archiviato, ma viene inviato al servizio Anthropic per l'estrazione.

## 6. Prova il flusso completo prima di registrare

Fai una prova con i dati demo prima di avviare la registrazione:

1. Nella sezione **Agenzia e Anagrafica cliente**, controlla il nome
   dell'agenzia e il testo del documento. Inserisci nome, email e telefono
   fittizi.
2. In **Conferma prenotazione**, seleziona il PDF demo e premi
   **Estrai una bozza da verificare**.
3. Aspetta il risultato. Controlla e correggi a mano Tour Operator, riferimento,
   descrizione del viaggio, date, viaggiatori e importo totale. Il parser
   propone i valori: la verifica resta tua.
4. In **Dati verificati e Incasso**, inserisci l'Incasso di esempio e controlla
   tutti i campi obbligatori.
5. Premi **Salva pratica e Incasso** e attendi il messaggio di conferma.
6. Premi **Genera PDF e link di conferma**.
7. Apri **Apri il PDF salvato** e controlla che i dati e il testo siano quelli
   previsti.
8. Apri **Apri anteprima cliente** in una finestra privata. Controlla che la
   pagina mostri lo stesso documento e che la casella di conferma funzioni.
9. Se vuoi mostrare anche l'accettazione, conferma usando solo il profilo
   fittizio. L'accettazione è monouso; per fare un'altra prova genera una nuova
   pratica e un nuovo link.

Il link cliente scade dopo sette giorni. L'app non invia email o messaggi:
mostra un link che l'operatore può condividere manualmente. Non presentare il
testo di esempio come consulenza legale.

## 7. Prepara registratore e copione

Prima di registrare:

1. Chiudi schede personali, password manager e applicazioni con notifiche.
2. Pulisci la barra dei preferiti e la cronologia visibile; nascondi ogni
   finestra non necessaria.
3. Imposta una risoluzione di registrazione leggibile, almeno 1920×1080 se
   disponibile, e prova il microfono.
4. Apri `video/screenplay-it.md` e `video/shot-list.md` su un secondo schermo o
   stampali, così non devi cercarli durante la ripresa.
5. Apri `video/narration-it.txt` e decidi se leggere la voce durante le riprese
   o registrarla dopo. Usa la tua voce o quella di un narratore umano
   autorizzato; non creare avatar o audio sintetico.
6. Fai un breve controllo di audio e immagine e riascoltalo prima della ripresa
   completa.

Non serve mostrare un timer. “Due Minuti” è il nome del progetto e non una
prestazione misurata.

## 8. Registra la demo

Registra le scene nell'ordine dello screenplay:

1. Presenta il progetto come app web open source e self-hosted.
2. Mostra il modulo Agenzia e Anagrafica con i dati inventati.
3. Seleziona il PDF demo e avvia l'estrazione.
4. Mostra la bozza ottenuta e verifica almeno un campo ad alta voce.
5. Correggi i valori necessari, registra l'Incasso e salva la pratica.
6. Genera il PDF, aprilo e mostra il link di conferma.
7. Apri la pagina cliente in finestra privata; mostra il documento e, se
   previsto, la conferma con il profilo fittizio.
8. Chiudi mostrando il README, la licenza MIT e la configurazione senza valori
   segreti.

Se una schermata non corrisponde al comportamento dell'app, interrompi e
correggi la preparazione. Non simulare risultati o passaggi. Puoi registrare
scene separate e montarle dopo; conserva i file originali fuori dal repository.

## 9. Monta ed esporta il video

1. Importa le registrazioni schermo e le tracce vocali nell'editor video.
2. Taglia attese, errori di ripresa, pause lunghe e informazioni personali
   finite per sbaglio nel frame.
3. Mantieni l'ordine del flusso e aggiungi titoli brevi per le fasi principali.
4. Aggiungi sottotitoli italiani e correggi nomi, date, importi e termini
   tecnici ascoltando la traccia.
5. Mantieni leggibili le schermate: evita zoom rapidi e non coprire i campi
   importanti con testo.
6. Aggiungi la nota che i dati estratti vanno verificati e che il testo
   contrattuale deve essere definito e revisionato dall'agenzia.
7. Esporta una copia di revisione in MP4, 1080p, H.264 con audio AAC.
8. Riguarda il file esportato dall'inizio alla fine e ascolta l'audio con le
   cuffie. Verifica che non siano rimasti dati riservati o affermazioni non
   dimostrate.
9. Salva il video finale in una cartella locale dedicata, per esempio
   `~/Movies/contratto-in-due-minuti-demo.mp4`. Tieni le registrazioni grezze
   separate; non aggiungere file video pesanti al repository senza una scelta
   esplicita.

Il risultato è un video demo completo e pronto per una revisione. Questa guida
non include la pubblicazione online, l'invio del link o il push del repository.

## File Markdown collegati

- [README e avvio dell'app](../README.md)
- [Copione con sequenza e tempi](video/screenplay-it.md)
- [Narrazione in testo semplice](video/narration-it.txt)
- [Shot list](video/shot-list.md)
- [Checklist di registrazione](recording-checklist-it.md)
- [Titoli, descrizione e teaser](video/youtube-copy-it.md)
