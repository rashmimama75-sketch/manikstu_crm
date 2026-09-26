import { NextResponse } from 'next/server';
import { authenticate } from '../../../../lib/users';
import { createSessionToken, ROLE_HOME, SESSION_COOKIE, SESSION_MAX_AGE } from '../../../../lib/session';

export async function POST(request: Request) {
  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = typeof body.email === 'string' ? body.email : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(user);
  } catch (err) {
    // Most likely AUTH_SECRET isn't set in this environment's variables.
    console.error('Login failed while creating the session token:', err);
    return NextResponse.json({ error: 'Server is misconfigured (missing AUTH_SECRET). Contact an admin.' }, { status: 500 });
  }

  const res = NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
