import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Trigger a stock reorder. Proxies to the CRM backend when one is configured. Offline,
// the manager dashboard restocks local sample rows itself and never calls this route.

export async function POST(request: Request) {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const r = await backendCall('/inventory/reorder', { method: 'POST', token, body });
    return await relay(r, 'Could not place the reorder.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
