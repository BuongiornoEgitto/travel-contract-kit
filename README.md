# Travel Contract Kit

An open-source web app for travel agencies. Upload a booking confirmation PDF,
review the extracted details, save the case and payment, then create a
contract summary PDF and a confirmation link for the customer.

The app is self-hosted. Each agency provides its own PostgreSQL database and
Anthropic API key. It does not run on our servers or send messages for you.
The agency shares the customer link manually.

## Run it yourself

You need Node.js, npm, a PostgreSQL database dedicated to this app, and an
Anthropic API key.

1. Download or clone this repository.
2. Create an empty PostgreSQL database. Do not reuse a database or credentials
   from another application.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`,
   `ANTHROPIC_API_KEY`, `APP_URL`, and a private `OPERATOR_PASSWORD`. You can
   also change `AGENCY_NAME` and `CONTRACT_TEMPLATE_TEXT`.
4. Apply `db/init.sql` once to the empty database. With `psql`, set the
   connection string in your terminal and run:

   ```bash
   export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE'
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/init.sql
   ```

   Or run `db/init.sql` in your database provider's SQL console. This is an
   initial database setup, not a migration system. `.env.local` is loaded by
   Next.js, not by your terminal.
5. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

6. Open `http://localhost:3000`. Sign in with username `operator` and the
   password from `OPERATOR_PASSWORD`.

See [docs/architecture.md](docs/architecture.md) for how the data flow works,
and [the full human guide](launch/guida-completa-repository-video.md) for a
demo walkthrough. See [AGENTS.md](AGENTS.md) for instructions to coding agents.

## Privacy and responsibility

Use a database that you control. Booking PDFs are processed in memory and are
not stored; the generated contract PDF and case data are stored in your
PostgreSQL database. The AI draft must be reviewed by a person. The sample
contract text is not legal advice; each agency is responsible for its own
contract wording and customer data.

## License

MIT. See [LICENSE](LICENSE).
