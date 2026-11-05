import { notFound } from 'next/navigation';
import { readConfirmation } from '@/lib/case';
import { accept } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConfirmationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ status?: string }> }) {
  const { token } = await params;
  const [{ status }, confirmation] = await Promise.all([searchParams, readConfirmation(token)]);
  if (!confirmation) notFound();
  const expired = confirmation.expires_at <= new Date();
  const unavailable = (expired && confirmation.accepted_at === null) || confirmation.revoked_at !== null;
  const payload = confirmation.payload;
  return <main className="confirmation">
    <p className="eyebrow">CONFERMA CONTRATTO</p>
    <h1>{unavailable ? 'Questo link non è più disponibile.' : confirmation.accepted_at ? 'Contratto confermato.' : 'Controlla e conferma.'}</h1>
    {status === 'error' && <p role="alert" className="error">Il link è scaduto o è già stato utilizzato.</p>}
    {confirmation.accepted_at && <p className="accepted" role="status">Confermato il {new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeStyle: 'short' }).format(confirmation.accepted_at)}.</p>}
    <p>Il riepilogo seguente corrisponde al documento immutabile associato a questo link.</p>
    <a href={`/api/confirm/${token}/pdf`} target="_blank" rel="noreferrer">Apri il PDF del contratto</a>
    <section className="contract-preview">
      <h2>{payload.agencyName}</h2><h3>Cliente</h3><p>{payload.clientName}<br />{payload.clientEmail || ''}<br />{payload.clientPhone || ''}</p>
      <h3>Viaggio</h3><p>{payload.tripDescription}<br />Tour Operator: {payload.operatorName}{payload.operatorReference ? ` · Rif. ${payload.operatorReference}` : ''}<br />Dal {date(payload.departureDate)} al {date(payload.returnDate)}</p>
      <h3>Viaggiatori</h3><ul>{payload.travellers.map((traveller, index) => <li key={`${traveller.fullName}-${index}`}>{traveller.fullName}{traveller.birthDate ? ` · ${date(traveller.birthDate)}` : ''}</li>)}</ul>
      <p><strong>Totale:</strong> {money(payload.totalCents)}<br /><strong>Incasso:</strong> {money(payload.receivedCents)}<br /><strong>Residuo:</strong> {money(payload.totalCents - payload.receivedCents)}</p>
      <h3>Testo dell’agenzia</h3><p className="template-copy">{payload.templateText}</p>
      <p className="legal-note">Riepilogo predisposto dall’agenzia. Le condizioni contrattuali applicabili sono quelle concordate con l’agenzia e riportate nella documentazione di viaggio.</p>
    </section>
    {!unavailable && !confirmation.accepted_at && <form action={async (formData: FormData) => { 'use server'; await accept(token, formData.get('confirmation')); }}><label><input type="checkbox" name="confirmation" value="yes" required /> Ho letto e confermo questo contratto.</label><button>Conferma contratto</button></form>}
    <p className="fingerprint">Impronta SHA-256 del documento: {payload.fingerprint}</p>
  </main>;
}

function date(value: string) { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
function money(value: number) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value / 100); }
