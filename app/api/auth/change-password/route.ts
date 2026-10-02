import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '../../../../lib/auth';
import { ROLE_HOME } from '../../../../lib/session';
import { API_TOKEN_COOKIE, backendFetch } from '../../../../lib/backend';

// Set the signed-in user's own password and clear the force-change flag.
export async function POST(request: Request) {
  const user = await getSession();
  const token = cookies().get(API_TOKEN_COOKIE)?.value;
  if (!user || !token) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const res = await backendFetch('/auth/change-password', { method: 'POST', body, token });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: (data as { error?: string }).error ?? 'Could not change the password.' }, { status: res.status });
    }
    return NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Please try again.' }, { status: 502 });
  }
}
