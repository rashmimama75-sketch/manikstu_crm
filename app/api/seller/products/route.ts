import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../lib/backend';

export const dynamic = 'force-dynamic';

// Seller adds / edits a product (price + show-on-website). Proxied to the CRM
// backend; in local (sample-data) mode it's a no-op so the UI still works.
async function forward(request: Request, method: 'POST' | 'PATCH', fallback: string) {
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
    const r = await backendCall('/seller/products', { method, token, body });
    return await relay(r, fallback);
  } catch {
    return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
  }
}

export const POST = (request: Request) => forward(request, 'POST', 'Could not add the product.');
export const PATCH = (request: Request) => forward(request, 'PATCH', 'Could not update the product.');
