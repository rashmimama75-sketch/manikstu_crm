import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../../lib/backend';

export const dynamic = 'force-dynamic';

// The telecalling team logs a call to the customer about a confirmed order. The
// backend decides who may and which orders qualify — this only forwards.
export async function POST(request: Request, { params }: { params: { id: string } }) {
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
    const r = await backendCall(`/orders/${encodeURIComponent(params.id)}/calls`, { method: 'POST', token, body });
    return await relay(r, 'Could not save the call.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
