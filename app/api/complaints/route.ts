import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../lib/backend';

export const dynamic = 'force-dynamic';

// Complaints for the signed-in role: the head and the manager see every ticket, a calling executive only the ones
// they have been put on (the backend decides). POST raises a new ticket (the telecalling head).

function guard(): { token: string } | NextResponse {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  return { token };
}

export async function GET() {
  const g = guard();
  if (g instanceof NextResponse) return g;
  try {
    const r = await backendCall('/complaints', { token: g.token });
    return await relay(r, 'Could not load complaints.');
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
    const r = await backendCall('/complaints', { method: 'POST', token: g.token, body });
    return await relay(r, 'Could not raise the complaint.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
