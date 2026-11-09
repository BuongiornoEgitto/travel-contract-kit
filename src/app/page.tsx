import { getConfig } from '@/lib/config';
import { BookingImportForm } from './booking-import-form';
// Agency name and contract text come from the configuration the operator saves
// at runtime, so this page must not be prerendered at build time.
export const dynamic = 'force-dynamic';
const steps = [['01', 'Crea Anagrafica', 'Nome e contatto del cliente.'], ['02', 'Trascina il PDF', 'L’AI produce una bozza da verificare.'], ['03', 'Genera il documento', 'Salva l’Incasso e crea PDF e link da condividere.']];
export default function Home() { const config = getConfig(); return <main><section className="hero"><p className="eyebrow">OPEN SOURCE · SELF-HOSTED</p><h1>Un contratto da un PDF.<br />In due minuti.</h1><p className="lede">Per agenzie viaggio: meno copia-incolla, più controllo. Il tuo server, i tuoi documenti, la tua chiave AI.</p><a href="#workflow">Guarda il flusso</a></section><section id="workflow" className="workflow">{steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}</section><BookingImportForm initialAgencyName={config.agencyName} initialTemplateText={config.contractTemplateText} /><section className="principles"><h2>La promessa è semplice.</h2><p>Il parser propone. Una persona verifica. Il cliente conferma uno specifico PDF immutabile.</p></section></main>; }
