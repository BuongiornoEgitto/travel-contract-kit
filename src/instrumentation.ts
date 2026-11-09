/**
 * Printed once at startup so a non-technical operator never has to create or
 * edit a file by hand: the terminal hands them a clickable, token-protected
 * link to the configuration wizard.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { isConfigured, missingConfiguration } = await import('./lib/config');
  if (isConfigured()) return;

  const { ensureSetupToken } = await import('./lib/setup/token');
  const token = ensureSetupToken();
  const port = process.env.PORT ?? '3000';
  const url = `http://localhost:${port}/setup?token=${token}`;

  const lines = [
    '',
    '='.repeat(72),
    '  TRAVEL CONTRACT KIT - CONFIGURAZIONE RICHIESTA',
    '='.repeat(72),
    '',
    '  Apri questo indirizzo nel browser per configurare l\'app:',
    '',
    `  ${url}`,
    '',
    '  (su Windows e Linux Ctrl+clic, su Mac Cmd+clic; oppure copialo e',
    '  incollalo nella barra degli indirizzi)',
    '',
    `  Mancano: ${missingConfiguration().join(', ')}`,
    '='.repeat(72),
    '',
  ];
  // Intentional console use: this is the only channel the operator can see.
  console.log(lines.join('\n'));
}
