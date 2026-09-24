import { TODAY, OrderStatus } from '../data/managerDashboard';

// Formatting helpers shared by the manager dashboard and orders pages.
// Dates are relative to TODAY so the sample data reads the same on any day.

export const MONTH = TODAY.slice(0, 7);
const DAY_MS = 86_400_000;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dayStart = (ts: string) => new Date(`${ts.slice(0, 10)}T00:00:00`).getTime();
export const daysBefore = (ts: string) => Math.round((dayStart(TODAY) - dayStart(ts)) / DAY_MS);
export const shortDate = (ts: string) => `${Number(ts.slice(8, 10))} ${MONTH_NAMES[Number(ts.slice(5, 7)) - 1]}`;
export const shortDateTime = (ts: string) => `${shortDate(ts)}, ${ts.slice(11, 16)}`;
export const ago = (ts: string) => {
  const d = daysBefore(ts);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const rupeesShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : rupees(n);
export const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100));

/** Current time on the sample TODAY, for stamping status changes. */
export const nowStamp = () => {
  const d = new Date();
  return `${TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Chip colour class for each order status. */
export const ORDER_CHIP: Record<OrderStatus, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  shipped: 'transit',
  delivered: 'delivered',
  cancelled: 'muted',
};
