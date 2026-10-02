import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../../lib/session';
import { API_TOKEN_COOKIE, backendFetch } from '../../../../lib/backend';

export async function POST(request: Request) {
  // Best-effort revoke of the backend token, then clear both cookies.
  const token = cookies().get(API_TOKEN_COOKIE)?.value;
  if (token) {
    try { await backendFetch('/auth/logout', { method: 'POST', token }); } catch { /* ignore */ }
  }
  const res = NextResponse.redirect(new URL('/login', request.url), 303);
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(API_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
