import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Seller lists/edits one of their products (price + show-on-website). Proxied to
// the CRM backend; in local (sample-data) mode it's a no-op so the UI still works.
export async function PATCH(request: Request) {
  if (!usingBackend()) {
    return NextResponse.json({ ok: true, local: true });
  }
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const r = await backendCall('/seller/products', { method: 'PATCH', token, body });
    return await relay(r, 'Could not update the product.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
