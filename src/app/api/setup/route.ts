import { NextResponse } from 'next/server';
import { isConfigured, writeConfig } from '@/lib/config';
import { applySchema, checkAnthropicKey, checkDatabase } from '@/lib/setup/install';
import { setupRequestSchema } from '@/lib/setup/schema';
import { clearSetupToken, setupTokenMatches } from '@/lib/setup/token';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Once the app is configured the wizard is closed; changes go through the file.
  if (isConfigured()) return NextResponse.json({ error: 'L’app e gia configurata. Per cambiare i dati modifica il file .env.local e riavvia.' }, { status: 409 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 403 });

  const parsed = setupRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dati non validi.' }, { status: 400 });
  const input = parsed.data;
  if (!setupTokenMatches(input.token)) return NextResponse.json({ error: 'Token di configurazione non valido. Riapri il link che vedi nel terminale.' }, { status: 403 });

  // Validate everything before touching the database, so a mistyped key never
  // leaves half-created tables behind.
  const database = await checkDatabase(input.databaseUrl);
  if (!database.ok) return NextResponse.json({ error: `Database: ${database.message}` }, { status: 400 });

  const key = await checkAnthropicKey(input.anthropicApiKey);
  if (!key.ok && key.fatal) return NextResponse.json({ error: key.message }, { status: 400 });

  const warnings: string[] = [];
  if (!key.ok) warnings.push(key.message);
  if (database.schemaPresent) {
    warnings.push('Le tabelle erano gia presenti in questo database: ho riusato quelle, senza toccare i dati esistenti.');
  } else {
    const applied = await applySchema(input.databaseUrl);
    if (!applied.ok) return NextResponse.json({ error: `Creazione tabelle: ${applied.message}` }, { status: 400 });
  }

  writeConfig({
    DATABASE_URL: input.databaseUrl,
    ANTHROPIC_API_KEY: input.anthropicApiKey,
    AGENCY_NAME: input.agencyName,
    CONTRACT_TEMPLATE_TEXT: input.contractTemplateText,
    APP_URL: input.appUrl,
    OPERATOR_PASSWORD: input.operatorPassword,
  });
  clearSetupToken();

  return NextResponse.json({ ok: true, schemaCreated: !database.schemaPresent, warnings });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
