# Architecture

This is a self-hosted application. It is not a shared SaaS and it has no
operator-controlled tenant database.

An agency owns the deployment, PostgreSQL database, document storage, AI key,
and outbound messaging configuration.

## First vertical slice

```text
Anagrafica -> booking PDF -> reviewed extraction -> contract snapshot
-> received payment -> confirmation link -> client acceptance
```

The parser produces a draft only. A human must review it before it can change
a case. A confirmation link always references one immutable contract snapshot;
editing the case revokes pending links and requires regeneration.

## Modules

- `case`: client, trip and received-payment data.
- `booking-import`: PDF upload, AI extraction and reviewable draft.
- `contract`: PDF snapshot, public token, expiry, revocation and acceptance
  evidence.

There is deliberately no abstraction for multiple AI providers, storage
providers, accounting systems or messaging providers in v1. Add a seam only
when a second concrete adapter is actually required.
