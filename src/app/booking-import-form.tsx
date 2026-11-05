'use client';

import { useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { BookingDraft } from '@/lib/booking-import/schema';

type FormDraft = {
  clientName: string; email: string; clientPhone: string; agencyName: string; templateText: string; operatorName: string; operatorReference: string;
  tripDescription: string; departureDate: string; returnDate: string; travellers: Array<{ fullName: string; birthDate: string }>;
  totalEuros: string; receivedEuros: string;
};
const emptyDraft: FormDraft = { clientName: '', email: '', clientPhone: '', agencyName: '', templateText: '', operatorName: '', operatorReference: '', tripDescription: '', departureDate: '', returnDate: '', travellers: [{ fullName: '', birthDate: '' }], totalEuros: '', receivedEuros: '0.00' };

export function BookingImportForm({ initialAgencyName, initialTemplateText }: { initialAgencyName: string; initialTemplateText: string }) {
  const [draft, setDraft] = useState<FormDraft>(() => ({ ...emptyDraft, agencyName: initialAgencyName, templateText: initialTemplateText }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ url: string; pdfUrl: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function readPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setNotice(null); setCaseId(null); setConfirmation(null);
    const file = fileInput.current?.files?.[0];
    if (!file) return setError('Scegli un PDF della prenotazione.');
    const formData = new FormData(); formData.set('pdf', file);
    setLoading(true);
    try {
      const response = await fetch('/api/booking-import', { method: 'POST', body: formData });
      const body = await readJson<{ draft?: BookingDraft; error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? 'Lettura del PDF non riuscita.');
      if (!body.draft) throw new Error('Il server non ha restituito una bozza valida.');
      const extracted = body.draft;
      setDraft((current) => ({ ...current,
        operatorName: extracted.operatorName.value ?? current.operatorName,
        operatorReference: extracted.operatorReference.value ?? current.operatorReference,
        tripDescription: extracted.tripDescription.value ?? current.tripDescription,
        departureDate: extracted.departureDate.value ?? current.departureDate,
        returnDate: extracted.returnDate.value ?? current.returnDate,
        travellers: extracted.travellers.length ? extracted.travellers.map((traveller) => ({ fullName: traveller.fullName.value ?? '', birthDate: traveller.birthDate.value ?? '' })) : current.travellers,
        totalEuros: extracted.totalCents.value === null ? current.totalEuros : (extracted.totalCents.value / 100).toFixed(2),
      }));
      setNotice('Bozza estratta. Controlla e correggi ogni campo prima di salvarla.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Lettura del PDF non riuscita.'); }
    finally { setLoading(false); }
  }

  async function saveCase() {
    setError(null); setNotice(null); setLoading(true);
    try {
      const response = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        clientName: draft.clientName, email: draft.email, clientPhone: draft.clientPhone, agencyName: draft.agencyName, templateText: draft.templateText, operatorName: draft.operatorName,
        operatorReference: draft.operatorReference, tripDescription: draft.tripDescription, departureDate: draft.departureDate,
        returnDate: draft.returnDate, travellers: draft.travellers.map((traveller) => ({ fullName: traveller.fullName, birthDate: traveller.birthDate || null })),
        totalCents: eurosToCents(draft.totalEuros), receivedCents: eurosToCents(draft.receivedEuros),
      }) });
      const body = await readJson<{ id: string; error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? 'Salvataggio pratica non riuscito.');
      setCaseId(body.id); setNotice('Anagrafica, pratica e Incasso salvati. Ora puoi generare il PDF e il link.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Salvataggio pratica non riuscito.'); }
    finally { setLoading(false); }
  }

  async function generateContract() {
    if (!caseId) return;
    setError(null); setLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/contract`, { method: 'POST' });
      const body = await readJson<{ url: string; pdfUrl: string; error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? 'Generazione documento non riuscita.');
      setConfirmation({ url: body.url, pdfUrl: body.pdfUrl }); setNotice('PDF immutabile creato e link di conferma attivo per sette giorni.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Generazione documento non riuscita.'); }
    finally { setLoading(false); }
  }

  return <section className="importer" id="crea-pratica">
    <p className="eyebrow">NUOVA PRATICA</p><h2>Da Anagrafica a conferma</h2>
    <p>Inserisci i contatti, carica la prenotazione e verifica i dati estratti. Il PDF inviato al cliente fotografa i dati salvati e non cambia in seguito.</p>
    <form onSubmit={readPdf}>
      <fieldset disabled={loading || Boolean(caseId)}><legend>1 · Agenzia e Anagrafica cliente</legend>
        <label>Nome agenzia sul documento <input required maxLength={200} value={draft.agencyName} onChange={(e) => setDraft({ ...draft, agencyName: e.target.value })} /></label>
        <label>Testo del documento <textarea required maxLength={8000} value={draft.templateText} onChange={(e) => setDraft({ ...draft, templateText: e.target.value })} /></label>
        <label>Nome e cognome <input required maxLength={200} value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} /></label>
        <label>Email <input type="email" maxLength={320} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
        <label>Telefono <input maxLength={50} value={draft.clientPhone} onChange={(e) => setDraft({ ...draft, clientPhone: e.target.value })} /></label>
      </fieldset>
      <fieldset disabled={loading || Boolean(caseId)}><legend>2 · Conferma prenotazione</legend>
        <label>PDF del Tour Operator <input ref={fileInput} type="file" accept="application/pdf,.pdf" required /></label>
        <button type="submit" disabled={loading}>{loading ? 'Lettura…' : 'Estrai una bozza da verificare'}</button>
      </fieldset>
      <fieldset disabled={loading || Boolean(caseId)}><legend>3 · Dati verificati e Incasso</legend>
        <label>Tour Operator <input required maxLength={200} value={draft.operatorName} onChange={(e) => setDraft({ ...draft, operatorName: e.target.value })} /></label>
        <label>Riferimento prenotazione <input maxLength={200} value={draft.operatorReference} onChange={(e) => setDraft({ ...draft, operatorReference: e.target.value })} /></label>
        <label>Viaggio <textarea required maxLength={2000} value={draft.tripDescription} onChange={(e) => setDraft({ ...draft, tripDescription: e.target.value })} /></label>
        <div className="field-grid"><label>Partenza <input type="date" required value={draft.departureDate} onChange={(e) => setDraft({ ...draft, departureDate: e.target.value })} /></label><label>Rientro <input type="date" required value={draft.returnDate} onChange={(e) => setDraft({ ...draft, returnDate: e.target.value })} /></label></div>
        <h3>Viaggiatori</h3>{draft.travellers.map((traveller, index) => <div className="field-grid traveller" key={index}>
          <label>Nome viaggiatore <input required maxLength={200} value={traveller.fullName} onChange={(e) => updateTraveller(setDraft, draft, index, 'fullName', e.target.value)} /></label>
          <label>Data di nascita <input type="date" value={traveller.birthDate} onChange={(e) => updateTraveller(setDraft, draft, index, 'birthDate', e.target.value)} /></label>
          {draft.travellers.length > 1 && <button className="secondary" type="button" onClick={() => setDraft({ ...draft, travellers: draft.travellers.filter((_, i) => i !== index) })}>Rimuovi</button>}
        </div>)}
        <button className="secondary" type="button" disabled={draft.travellers.length >= 30} onClick={() => setDraft({ ...draft, travellers: [...draft.travellers, { fullName: '', birthDate: '' }] })}>Aggiungi viaggiatore</button>
        <div className="field-grid"><label>Totale (€) <input type="number" min="0" step="0.01" required value={draft.totalEuros} onChange={(e) => setDraft({ ...draft, totalEuros: e.target.value })} /></label><label>Incasso registrato (€) <input type="number" min="0" step="0.01" required value={draft.receivedEuros} onChange={(e) => setDraft({ ...draft, receivedEuros: e.target.value })} /></label></div>
        <button type="button" disabled={loading || !draft.operatorName || !draft.tripDescription || !draft.clientName || !draft.agencyName || !draft.templateText} onClick={saveCase}>{loading ? 'Salvataggio…' : 'Salva pratica e Incasso'}</button>
      </fieldset>
    </form>
    {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {caseId && !confirmation && <button disabled={loading} onClick={generateContract}>{loading ? 'Generazione…' : 'Genera PDF e link di conferma'}</button>}
    {confirmation && <div className="draft"><h3>Documento pronto</h3><p><a href={confirmation.pdfUrl} target="_blank" rel="noreferrer">Apri il PDF salvato</a></p><label>Link cliente <input readOnly value={confirmation.url} onFocus={(e) => e.currentTarget.select()} /></label><a href={confirmation.url} target="_blank" rel="noreferrer">Apri anteprima cliente</a></div>}
  </section>;
}

function updateTraveller(setDraft: Dispatch<SetStateAction<FormDraft>>, draft: FormDraft, index: number, key: 'fullName' | 'birthDate', value: string) {
  setDraft({ ...draft, travellers: draft.travellers.map((traveller, i) => i === index ? { ...traveller, [key]: value } : traveller) });
}
function eurosToCents(value: string): number { const amount = Number(value); if (!Number.isFinite(amount) || amount < 0 || amount > 20_000_000) throw new Error('Importo non valido.'); return Math.round(amount * 100); }
async function readJson<T extends object>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch { throw new Error(response.ok ? 'Risposta del server non valida.' : `Il server ha risposto con errore (${response.status}). Verifica accesso e configurazione.`); }
}
