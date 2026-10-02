import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_TOKEN_COOKIE, backendFetch } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const token = cookies().get(API_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const res = await backendFetch('/inventory/reorder', { method: 'POST', body, token });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Could not reach the server. Please try again.' }, { status: 502 });
  }
}
