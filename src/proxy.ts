import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * v1 is intentionally a single-agency self-hosted app. Basic authentication
 * is a small operational guard, not a replacement for future user accounts.
 * Public confirmation links bypass this proxy and are protected by UUID token.
 */
export function proxy(request: NextRequest) {
  const password = process.env.OPERATOR_PASSWORD;
  if (!password || password === 'change-this-before-public-use') return new NextResponse('Configura una OPERATOR_PASSWORD robusta.', { status: 503 });
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+=*)$/);
  let supplied = '';
  try { if (match) supplied = Buffer.from(match[1], 'base64').toString('utf8'); } catch { /* handled as unauthorized */ }
  const actual = Buffer.from(supplied); const expected = Buffer.from(`operator:${password}`);
  if (actual.length === expected.length && timingSafeEqual(actual, expected)) return NextResponse.next();
  return new NextResponse('Autenticazione richiesta.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Contratto in Due Minuti"' } });
}

export const config = { matcher: ['/((?!(?:confirm|api/confirm)(?:/|$)|_next/|favicon.ico).*)'] };
