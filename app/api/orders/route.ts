import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../lib/backend';

export const dynamic = 'force-dynamic';

// Orders for the signed-in role (the backend scopes what each role may see: the
// manager gets every order, telecalling gets orders the seller has confirmed).
export async function GET(request: Request) {
  if (!usingBackend()) return NextResponse.json({ error: 'No backend configured.' }, { status: 400 });
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  try {
    const r = await backendCall('/orders', {
      token,
      query: { status: sp.get('status'), communication_status: sp.get('communication_status'), q: sp.get('q') },
    });
    return await relay(r, 'Could not load orders.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
