import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Approve/settle a transaction. Proxies to the CRM backend when one is configured.
// Offline, the manager dashboard settles the local sample row itself and never calls this.

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  try {
    const r = await backendCall(`/finance/transactions/${encodeURIComponent(params.id)}/approve`, { method: 'POST', token });
    return await relay(r, 'Could not approve the transaction.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
