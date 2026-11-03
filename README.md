# Contratto in Due Minuti

An open-source, self-hosted workflow for turning a travel booking PDF into a
reviewed contract and a secure client confirmation link.

You own the deployment, database, documents and AI bill. There is no account
on our infrastructure and no per-agency database paid by us.

## The promise

1. Create the **Anagrafica**.
2. Drop the Tour Operator booking PDF.
3. Review the AI draft.
4. Generate the contract, record the **Incasso**, and send its link.
5. The client confirms the exact contract snapshot.

## Status

The first slice is available: PDF upload → Anthropic-powered, reviewable
extraction draft. The upload is held in memory only and is not stored yet.
Persistence, contract rendering and public confirmation are the next vertical
slices.

## Local start

```bash
cp .env.example .env.local
docker compose up -d postgres
npm install
npm run dev
```

Do not put API keys in source control. The AI key belongs to the agency that
runs the instance.

## License

[MIT](LICENSE). The included template is a technical example, not legal advice;
each agency is responsible for having its contract wording reviewed.
