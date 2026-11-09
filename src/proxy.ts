import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getConfig, isConfigured, missingConfiguration } from '@/lib/config';

/**
 * v1 is intentionally a single-agency self-hosted app. Basic authentication
 * is a small operational guard, not a replacement for future user accounts.
 * Public confirmation links bypass this proxy and are protected by UUID token.
 * The setup wizard is reachable before any password exists; it guards itself
 * with the one-time token printed in the terminal.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/setup' || pathname === '/api/setup') return NextResponse.next();

  if (!isConfigured()) {
    if (missingConfiguration().length === 1 && missingConfiguration()[0] === 'OPERATOR_PASSWORD') {
      // An installation configured by hand but left on the sample password.
      return new NextResponse('Configura una OPERATOR_PASSWORD robusta.', { status: 503 });
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  const password = getConfig().operatorPassword;
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+=*)$/);
  let supplied = '';
  try { if (match) supplied = Buffer.from(match[1], 'base64').toString('utf8'); } catch { /* handled as unauthorized */ }
  const actual = Buffer.from(supplied); const expected = Buffer.from(`operator:${password}`);
  if (actual.length === expected.length && timingSafeEqual(actual, expected)) return NextResponse.next();
  return new NextResponse('Autenticazione richiesta.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Contratto in Due Minuti"' } });
}

export const config = { matcher: ['/((?!(?:confirm|api/confirm)(?:/|$)|_next/|favicon.ico).*)'] };
