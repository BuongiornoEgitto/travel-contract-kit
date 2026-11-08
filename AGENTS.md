# Instructions for coding agents

Before making changes, read this file, `README.md`, and
`docs/architecture.md`. Check the current Git status and preserve existing
work.

## Product boundaries

- This is a self-hosted web app for one travel agency per installation.
- The agency owns and pays for its PostgreSQL database and AI provider key.
- Do not add a hosted service, desktop installer, mandatory Docker setup, or
  connection to another product's database unless the user asks for it.
- Keep secrets in local environment configuration. Never read out, log, or
  commit `.env.local`, API keys, passwords, or real customer data.
- Use synthetic or anonymized booking data in examples and demonstrations.

## Data and customer flow

- Treat PDF extraction as an untrusted proposal. The operator must review and
  correct the fields before saving a case.
- Validate user and external input at the boundary and report failures clearly.
- Preserve the immutable contract snapshot, token expiry, revocation, and
  one-time customer confirmation behavior.
- Do not claim legal validity, measured speed, or AI accuracy without evidence.
- The app does not send email or messages; the agency shares the confirmation
  link itself.

## Working practice

- Follow the existing Next.js, TypeScript, PostgreSQL, and Zod patterns.
- Keep changes small and focused. Prefer `apply_patch` for text edits.
- Do not discard, stage, or commit unrelated user changes.
- Do not push, publish, or deploy unless the user explicitly asks.
- Run checks only when requested, and report exactly what was run.
- Update the README or architecture notes when behavior or setup changes.
