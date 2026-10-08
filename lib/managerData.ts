import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, usingBackend } from './backend';
import { SALES_ORDERS, type OrderReport, type SalesOrder } from '../data/managerDashboard';
import { INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS, type Customer, type Transaction } from '../data/initialData';
import { INITIAL_STOCK, type StockRow } from '../data/centralInventory';

// The manager dashboard's non-tracker data (orders, farmers, inventory, finance),
// fetched on the server for the first render. Mirrors lib/initialTracker.ts: from the
// backend when one is configured, otherwise the local sample data. Each endpoint falls
// back to the sample independently if the backend is unreachable, so the page always renders.

export interface ManagerData {
  orders: SalesOrder[];
  /** Seller-wise / telecaller-wise order roll-ups; null offline. */
  orderReport: OrderReport | null;
  customers: Customer[];
  stock: StockRow[];
  transactions: Transaction[];
}

/** One authenticated GET to the backend, returning the parsed body, or null on any failure. */
async function get(path: string, token: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await backendCall(path, { token });
    if (!r.ok) return null;
    return (await r.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export async function getManagerData(): Promise<ManagerData> {
  const sample: ManagerData = {
    orders: SALES_ORDERS,
    orderReport: null,
    customers: INITIAL_CUSTOMERS,
    stock: INITIAL_STOCK,
    transactions: INITIAL_TRANSACTIONS,
  };
  if (!usingBackend()) return sample;
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return sample;

  const [orders, report, customers, inventory, finance] = await Promise.all([
    get('/orders', token),
    get('/reports/orders', token),
    get('/customers', token),
    get('/inventory', token),
    get('/finance/transactions', token),
  ]);

  return {
    orders: (orders?.data as SalesOrder[]) ?? sample.orders,
    orderReport: (report as unknown as OrderReport | null) ?? null,
    customers: (customers?.data as Customer[]) ?? sample.customers,
    stock: (inventory?.rows as StockRow[]) ?? sample.stock,
    transactions: (finance?.data as Transaction[]) ?? sample.transactions,
  };
}
