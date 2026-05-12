import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KNOWN_CODES = new Set([
  'auth/forbidden-domain',
  'auth/email-not-verified',
  'auth/cookies-blocked',
  'auth/state-mismatch',
  'auth/invalid-callback',
]);

function loginRedirect(origin: string, errorCode: string): NextResponse {
  const url = new URL('/login', origin);
  url.searchParams.set('error', errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const providerError = searchParams.get('error');

  // 1) Provider/BE-supplied error precedes the code exchange.
  if (providerError) {
    const normalized = KNOWN_CODES.has(providerError)
      ? providerError
      : 'auth/invalid-callback';
    return loginRedirect(origin, normalized);
  }

  if (!code) {
    return loginRedirect(origin, 'auth/invalid-callback');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const code = (error as { code?: string }).code;
    const normalized =
      code && KNOWN_CODES.has(code) ? code : 'auth/invalid-callback';
    return loginRedirect(origin, normalized);
  }

  // Constrain `next` to relative paths to avoid open-redirect.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return NextResponse.redirect(new URL(safeNext, origin));
}
