'use client';

import { useState } from 'react';
import { fieldsNeedingReview, type BookingDraft } from '@/lib/booking-import/schema';

export function BookingImportForm() {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true); setError(null); setDraft(null);
    const response = await fetch('/api/booking-import', { method: 'POST', body: formData });
    const body = await response.json() as { draft?: BookingDraft; error?: string };
    setLoading(false);
    if (!response.ok || !body.draft) return setError(body.error ?? 'Parsing non riuscito.');
    setDraft(body.draft);
  }

  return <section className="importer">
    <h2>Prova il parser</h2>
    <p>Il PDF viene elaborato con la chiave AI configurata da questa agenzia. La bozza non salva né modifica alcun contratto.</p>
    <form action={submit}><input name="pdf" type="file" accept="application/pdf" required /><button disabled={loading}>{loading ? 'Lettura PDF…' : 'Crea bozza'}</button></form>
    {error && <p role="alert" className="error">{error}</p>}
    {draft && <div className="draft"><h3>Bozza pronta — verifica prima di continuare</h3><p><strong>Da controllare:</strong> {fieldsNeedingReview(draft).join(', ') || 'nessun campo'}</p><dl><dt>Tour Operator</dt><dd>{draft.operatorName.value ?? '—'}</dd><dt>Viaggio</dt><dd>{draft.tripDescription.value ?? '—'}</dd><dt>Periodo</dt><dd>{draft.departureDate.value ?? '—'} → {draft.returnDate.value ?? '—'}</dd><dt>Totale</dt><dd>{draft.totalCents.value === null ? '—' : `€ ${(draft.totalCents.value / 100).toFixed(2)}`}</dd></dl></div>}
  </section>;
}
