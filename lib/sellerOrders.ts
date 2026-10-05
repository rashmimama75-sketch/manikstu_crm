import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, usingBackend } from './backend';
import type { SalesOrder } from '../data/managerDashboard';

/**
 * The signed-in seller's orders from the CRM backend — their slice of every
 * order that contains their products, including website orders that arrived
 * through the integration endpoint. Returns null in local mode or on any
 * failure, so the caller falls back to sample data.
 */
export async function fetchSellerOrders(): Promise<{ orders: SalesOrder[]; mixedOrderIds: number[] } | null> {
  if (!usingBackend()) return null;
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const r = await backendCall('/seller/orders', { token });
    if (!r.ok) return null;
    const body = await r.json().catch(() => null);
    if (!body || !Array.isArray(body.data)) return null;
    return { orders: body.data as SalesOrder[], mixedOrderIds: (body.mixedOrderIds ?? []) as number[] };
  } catch {
    return null;
  }
}
