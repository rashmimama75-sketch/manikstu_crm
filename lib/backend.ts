import { cookies } from 'next/headers';
import { sampleState, type TrackerState } from './trackerOps';
import { SALES_ORDERS, type SalesOrder } from '../data/managerDashboard';
import { INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS, type Customer, type Transaction } from '../data/initialData';
import { INITIAL_STOCK, type StockRow } from '../data/centralInventory';

// Server-side client for the Manikstu CRM backend (manikstu_crm_backend).
// All calls happen on the Next.js server; the Sanctum token lives in an httpOnly
// cookie and is never exposed to the browser. Server-only: do not import from client code.

export const API_BASE = process.env.MANIKSTU_CRM_API ?? 'http://127.0.0.1:8000/api';

/** httpOnly cookie holding the backend's Sanctum bearer token. */
export const API_TOKEN_COOKIE = 'mk_api';

export function getApiToken(): string | undefined {
  return cookies().get(API_TOKEN_COOKIE)?.value;
}

/** One call to the backend. Attaches the bearer token and asks for JSON. */
export async function backendFetch(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<Response> {
  const { method = 'GET', body, token } = opts;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

/**
 * Initial shared tracker state for a dashboard's first server render. The backend
 * scopes it to the signed-in user's role. Falls back to the sample data if the
 * backend can't be reached, so the page still renders.
 */
export async function fetchTrackerState(token: string | undefined): Promise<TrackerState> {
  if (!token) return sampleState();
  try {
    const res = await backendFetch('/tracker', { token });
    if (!res.ok) return sampleState();
    const data = await res.json();
    return (data.state ?? sampleState()) as TrackerState;
  } catch {
    return sampleState();
  }
}

/** One GET to the backend, parsed, or null on any failure. */
async function getJson(path: string, token: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await backendFetch(path, { token });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ManagerData {
  orders: SalesOrder[];
  customers: Customer[];
  stock: StockRow[];
  transactions: Transaction[];
}

/**
 * The manager dashboard's non-tracker data (orders, farmers, inventory, finance),
 * fetched server-side for the first render. Each falls back to the sample data if
 * the backend can't be reached, so the dashboard always renders.
 */
export async function fetchManagerData(token: string | undefined): Promise<ManagerData> {
  const fallback: ManagerData = {
    orders: SALES_ORDERS,
    customers: INITIAL_CUSTOMERS,
    stock: INITIAL_STOCK,
    transactions: INITIAL_TRANSACTIONS,
  };
  if (!token) return fallback;

  const [orders, customers, inventory, finance] = await Promise.all([
    getJson('/orders', token),
    getJson('/customers', token),
    getJson('/inventory', token),
    getJson('/finance/transactions', token),
  ]);

  return {
    orders: (orders?.data as SalesOrder[]) ?? fallback.orders,
    customers: (customers?.data as Customer[]) ?? fallback.customers,
    stock: (inventory?.rows as StockRow[]) ?? fallback.stock,
    transactions: (finance?.data as Transaction[]) ?? fallback.transactions,
  };
}
