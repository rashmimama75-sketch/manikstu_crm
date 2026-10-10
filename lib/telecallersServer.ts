import { cookies } from 'next/headers';
import type { Telecaller, TrackerSale } from '../data/managerDashboard';
import { TOKEN_COOKIE, backendCall, usingBackend } from './backend';
import { applyTelecallers } from './telecallers';
import { applySales, emptySampleData } from './liveMode';

/**
 * The calling executives from the CRM backend, also applied on the server straight away. Returns them so the
 * page can hand the same list to the browser (see TelecallersSync); empty when there is no backend.
 */
export async function loadTelecallers(): Promise<Telecaller[]> {
  if (!usingBackend()) return [];
  emptySampleData(); // live mode: no made-up data on screen
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return [];
  try {
    const r = await backendCall('/tracker/meta', { token });
    if (!r.ok) return [];
    const body = await r.json().catch(() => null);
    const list = (body?.telecallers ?? []) as Telecaller[];
    applyTelecallers(list);
    return list;
  } catch {
    return [];
  }
}

/**
 * The real telecalling sales from the CRM backend, applied on the server straight away (see applySales). Returns them so
 * the page can hand the same list to the browser. Empty when there is no backend.
 */
export async function loadSales(): Promise<TrackerSale[]> {
  if (!usingBackend()) return [];
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return [];
  try {
    const r = await backendCall('/tracker/sales', { token });
    if (!r.ok) return [];
    const body = await r.json().catch(() => null);
    const list = (body?.data ?? []) as TrackerSale[];
    applySales(list);
    return list;
  } catch {
    return [];
  }
}
