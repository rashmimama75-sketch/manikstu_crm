import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Seller restocks a product (adds units). Proxied to the CRM backend, which
// persists the new total; in local (sample-data) mode it's a no-op so the UI
// still works on its own optimistic update.
export async function POST(request: Request, { params }: { params: { id: string } }) {
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
    const r = await backendCall(`/seller/products/${params.id}/restock`, { method: 'POST', token, body });
    return await relay(r, 'Could not restock the product.');
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}
