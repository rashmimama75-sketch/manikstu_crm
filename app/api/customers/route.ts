import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../lib/backend';

export const dynamic = 'force-dynamic';

// Farmer directory. Proxies to the CRM backend when one is configured. Offline, the
// manager dashboard mutates local sample data itself and never calls this route.

function guard(): { token: string } | NextResponse {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  return { token };
}

export async function GET(request: Request) {
  const g = guard();
  if (g instanceof NextResponse) return g;
  const q = new URL(request.url).searchParams.get('q');
  try {
    const r = await backendCall('/customers', { token: g.token, query: { q } });
    return await relay(r, 'Could not load farmers.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const g = guard();
  if (g instanceof NextResponse) return g;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const r = await backendCall('/customers', { method: 'POST', token: g.token, body });
    return await relay(r, 'Could not add the farmer.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
