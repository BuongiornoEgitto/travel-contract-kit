import type { ContractSnapshot } from './snapshot';

/** Small dependency-free PDF writer for a readable, multi-page A4 contract snapshot. */
export function renderContractPdf(contract: ContractSnapshot): Buffer {
  const lines = [
    contract.agencyName, 'RIEPILOGO CONTRATTO DI VIAGGIO', '',
    `Cliente: ${contract.clientName}`, `Email: ${contract.clientEmail || '—'}`, `Telefono: ${contract.clientPhone || '—'}`,
    `Tour Operator: ${contract.operatorName}`, `Riferimento prenotazione: ${contract.operatorReference || '—'}`,
    `Viaggio: ${contract.tripDescription}`, `Partenza: ${formatDate(contract.departureDate)}`, `Rientro: ${formatDate(contract.returnDate)}`,
    '', 'VIAGGIATORI', ...contract.travellers.map((traveller, index) => `${index + 1}. ${traveller.fullName} — nascita: ${traveller.birthDate ? formatDate(traveller.birthDate) : 'non indicata'}`),
    '', `Totale pratica: ${money(contract.totalCents)}`, `Incasso registrato: ${money(contract.receivedCents)}`, `Residuo: ${money(contract.totalCents - contract.receivedCents)}`,
    '', 'CONDIZIONI / TESTO AGENZIA', ...wrap(contract.templateText, 86), '', `Documento generato: ${new Date(contract.generatedAt).toLocaleString('it-IT', { timeZone: 'UTC' })} UTC`, `Impronta SHA-256: ${contract.fingerprint}`,
    '', 'Documento riepilogativo predisposto dall’agenzia. Verificare le condizioni contrattuali applicabili e la documentazione del Tour Operator.',
  ].flatMap((line) => wrap(line, 92));
  const perPage = 46;
  const pages = Array.from({ length: Math.ceil(lines.length / perPage) }, (_, index) => lines.slice(index * perPage, (index + 1) * perPage));
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  pages.forEach((page, index) => {
    const pageId = pageIds[index]; const streamId = pageId + 1;
    const commands = ['BT', '/F1 10 Tf', '48 794 Td', '14 TL', ...page.flatMap((line) => [`(${pdfString(line)}) Tj`, 'T*']), 'ET'].join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${Buffer.byteLength(commands, 'ascii')} >>\nstream\n${commands}\nendstream`;
  });
  let output = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id++) { offsets[id] = Buffer.byteLength(output, 'ascii'); output += `${id} 0 obj\n${objects[id]}\nendobj\n`; }
  const xref = Buffer.byteLength(output, 'ascii');
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'binary');
}

function wrap(value: string, width: number): string[] {
  const words = value.split(/\s+/); const lines: string[] = []; let line = '';
  for (const word of words) { if ((line + ' ' + word).trim().length > width && line) { lines.push(line); line = word; } else line = (line + ' ' + word).trim(); }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
function pdfString(value: string): string {
  const map: Record<string, number> = { '€': 128, '’': 146, '“': 147, '”': 148, '–': 150, '—': 151, '…': 133, '•': 149, 'à': 224, 'è': 232, 'é': 233, 'ì': 236, 'ò': 242, 'ù': 249, 'À': 192, 'È': 200, 'É': 201, 'Ì': 204, 'Ò': 210, 'Ù': 217 };
  return Array.from(value).map((char) => {
    const code = map[char] ?? char.charCodeAt(0);
    if (char === '(' || char === ')' || char === '\\') return `\\${char}`;
    if (code < 32 || code > 255) return '?';
    if (code > 126) return `\\${code.toString(8).padStart(3, '0')}`;
    return char;
  }).join('');
}
function money(cents: number) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100); }
function formatDate(value: string) { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
