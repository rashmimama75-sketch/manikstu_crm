import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Every client the Marketing page can message on WhatsApp: website orders, enquiries and complaints plus the leads the
// team imported, one row per phone number (the backend merges them). Offline there is no backend and the page falls
// back to the sample data.
export async function GET() {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const r = await backendCall('/marketing/clients', { token });
    return await relay(r, 'Could not load clients.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
