import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_TOKEN_COOKIE, backendFetch } from '../../../lib/backend';

export const dynamic = 'force-dynamic';

// Staff onboarding, run by the telecalling head. Forwards to the CRM backend.

function apiToken(): string | undefined {
  return cookies().get(API_TOKEN_COOKIE)?.value;
}

export async function GET() {
  const token = apiToken();
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const res = await backendFetch('/telecalling/staff', { token });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Please try again.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const token = apiToken();
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const res = await backendFetch('/telecalling/staff', { method: 'POST', body, token });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Please try again.' }, { status: 502 });
  }
}
