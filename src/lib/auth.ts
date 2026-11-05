import { timingSafeEqual } from 'node:crypto';

export function operatorGuard(request: Request): Response | null {
  const password = process.env.OPERATOR_PASSWORD;
  if (!password || password === 'change-this-before-public-use') return new Response('Configura una OPERATOR_PASSWORD robusta.', { status: 503 });
  if (!sameOrigin(request)) return new Response('Richiesta non valida.', { status: 403 });
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+=*)$/);
  let supplied = '';
  try { if (match) supplied = Buffer.from(match[1], 'base64').toString('utf8'); } catch { /* Invalid credential is handled below. */ }
  const expected = `operator:${password}`;
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return new Response('Autenticazione richiesta.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Contratto in Due Minuti"' } });
  }
  return null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch { return false; }
}
