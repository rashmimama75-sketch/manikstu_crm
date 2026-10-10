import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Work one ticket: change fields and log what happened. The backend decides who may do what
// (the head anything; an executive only their own ticket, and only move it along, resolve it or hand it back).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    const r = await backendCall(`/complaints/${encodeURIComponent(params.id)}`, { method: 'PATCH', token, body });
    return await relay(r, 'Could not update the complaint.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
