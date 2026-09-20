import { NextResponse } from 'next/server';

export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers });
}

export const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * Consistent server-error response. Never leaks stack traces / SQL to clients;
 * the real error goes to the server log (Vercel logs).
 */
export function serverError(scope, err, publicMessage = 'Something went wrong. Please try again.') {
  console.error(`[${scope}]`, err?.message || err);
  return NextResponse.json({ error: publicMessage }, { status: 500, headers: NO_STORE });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return (fwd.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
}
