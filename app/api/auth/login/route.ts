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

  const res = NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
