import { NextResponse } from 'next/server';
import { createSessionToken, ROLE_HOME, SESSION_COOKIE, SESSION_MAX_AGE, type Role, type SessionUser } from '../../../../lib/session';
import { API_TOKEN_COOKIE, backendFetch } from '../../../../lib/backend';

// Authenticates against the CRM backend, then stores two httpOnly cookies:
//  - mk_session: the signed session the Next.js middleware + server components read
//  - mk_api:     the backend's Sanctum token, used server-side for data calls
export async function POST(request: Request) {
  let identifier = '';
  let password = '';
  try {
    const body = await request.json();
    // `login` (email / staff ID / mobile); `email` kept for backward compatibility.
    identifier = typeof body.login === 'string' ? body.login : typeof body.email === 'string' ? body.email : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email/Staff ID and password are required' }, { status: 400 });
  }

  let res: Response;
  try {
    // The backend accepts email, staff ID or mobile under `login`.
    res = await backendFetch('/auth/login', { method: 'POST', body: { login: identifier, password } });
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Try again.' }, { status: 502 });
  }

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    return NextResponse.json({ error: (data as { error?: string }).error ?? 'Incorrect email or password' }, { status: res.status });
  }

  const u = (data as { user?: Record<string, unknown>; token?: string; mustChangePassword?: boolean }).user ?? {};
  const role = u.role as Role;
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_HOME, role)) {
    return NextResponse.json({ error: 'This account has no dashboard.' }, { status: 403 });
  }
  const user: SessionUser = {
    id: String(u.id ?? ''),
    name: String(u.name ?? ''),
    initials: String(u.initials ?? ''),
    role,
    staffId: String(u.staffId ?? ''),
  };

  let sessionToken: string;
  try {
    sessionToken = await createSessionToken(user);
  } catch (err) {
    console.error('Login failed while creating the session token:', err);
    return NextResponse.json({ error: 'Server is misconfigured (missing AUTH_SECRET). Contact an admin.' }, { status: 500 });
  }

  const mustChangePassword = Boolean((data as { mustChangePassword?: boolean }).mustChangePassword);
  const out = NextResponse.json({
    // Force the "set your own password" screen before anything else when required.
    redirectTo: mustChangePassword ? '/change-password' : ROLE_HOME[role],
    mustChangePassword,
  });
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
  out.cookies.set(SESSION_COOKIE, sessionToken, cookieOpts);
  out.cookies.set(API_TOKEN_COOKIE, String((data as { token?: string }).token ?? ''), cookieOpts);
  return out;
}
