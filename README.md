# Travel Contract Kit

[Versione italiana](README.it.md)

An open-source web app for travel agencies. Upload a booking confirmation PDF,
review the extracted details, save the case and payment, then create a
contract summary PDF and a confirmation link for the customer.

The app is self-hosted. Each agency provides its own PostgreSQL database and
Anthropic API key. It does not run on our servers or send messages for you.
The agency shares the customer link manually.

## What you need first

Two accounts, created in a browser. Nothing else is required up front.

1. **An empty PostgreSQL database**, dedicated to this app. A free database on
   [Neon](https://neon.com) works: create a project and copy the connection
   string it shows you. Do not reuse a database or credentials from another
   application.
2. **An Anthropic API key** from
   [console.anthropic.com](https://console.anthropic.com/settings/keys), with
   some credit on the account. Reading the booking PDFs is billed to you.

## Install it

Install [Node.js](https://nodejs.org) (the LTS version), download this
repository with the green **Code** button on GitHub and **Download ZIP**, then
unzip it. Open a terminal in the unzipped folder and run two commands:

```bash
npm install
npm run dev
```

On the first run the terminal prints a link like
`http://localhost:3000/setup?token=...`. Open it (Ctrl+click on Windows and
Linux, Cmd+click on macOS, or copy and paste it into the browser). A guided
page asks for the two values above and a password you choose, then writes the
configuration and creates the database tables for you. No file editing, no
SQL console, no `psql` or `git` installation.

When it is done, open `http://localhost:3000` and sign in with username
`operator` and your password.

**Opening a terminal in the folder:** on Windows, right-click the folder and
choose "Open in Terminal", or open PowerShell from the Start menu and run
`cd` followed by the folder path. On macOS, right-click the folder in Finder
and choose Services, then "New Terminal at Folder". On Linux, right-click
inside the folder and choose "Open in Terminal".

### Let a coding agent do it

If you prefer, open a coding agent (Claude Code, Cursor, Codex, ...) in an
empty folder and paste this:

```text
I want to install and run the open-source app "Travel Contract Kit" from
https://github.com/BuongiornoEgitto/travel-contract-kit on my computer.

Do all the steps for me, explaining in plain language what you are doing:

1. Check that Node.js and npm are installed; if not, guide me to install them.
2. Download the repository and read README.md and AGENTS.md.
3. Run npm install, then npm run dev.
4. Show me the http://localhost:3000/setup?token=... link the app prints in
   the terminal, and tell me to open it in my browser.

I will fill in the guided setup page myself, because it asks for my database
connection string and my API key. Do not ask me to paste those in chat, do not
create or edit .env.local yourself, do not publish anything online and do not
deploy.
```

### Configure by hand instead

The guided page is optional. You can create `.env.local` yourself from
`.env.example`, set `DATABASE_URL`, `ANTHROPIC_API_KEY`, `APP_URL` and a
private `OPERATOR_PASSWORD` of at least 12 characters, and apply `db/init.sql`
once to the empty database, either from your provider's SQL console or with
`psql`:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
```

In PowerShell on Windows the first line is `$env:DATABASE_URL='...'` instead,
and `psql` has to be installed separately. This is an initial database setup,
not a migration system.

## Running it again later

`npm run dev` in the same folder. The app reads `.env.local`, so it starts
straight into the sign-in prompt. To change a setting afterwards, edit
`.env.local` directly; the guided page closes itself once the app is
configured.

For a production run, use `npm run build` and then `npm start`.

See [docs/architecture.md](docs/architecture.md) for how the data flow works,
and [the full human guide](launch/guida-completa-repository-video.md) for a
demo walkthrough. See [AGENTS.md](AGENTS.md) for instructions to coding agents.

## Privacy and responsibility

Use a database that you control. Booking PDFs are processed in memory and are
not stored; the generated contract PDF and case data are stored in your
PostgreSQL database. Your credentials stay in `.env.local` on your own
machine, which is excluded from Git. The AI draft must be reviewed by a
person. The sample contract text is not legal advice; each agency is
responsible for its own contract wording and customer data.

## License

MIT. See [LICENSE](LICENSE).
