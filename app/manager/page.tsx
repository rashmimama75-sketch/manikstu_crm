import type { Metadata } from 'next';
import ManagerDashboard from '../../components/ManagerDashboard';
import { requireRole } from '../../lib/auth';
import { fetchManagerData, fetchTrackerState, getApiToken } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Manager Dashboard',
};

export default async function ManagerPage() {
  const user = await requireRole('manager');
  const token = getApiToken();
  const [tracker, data] = await Promise.all([fetchTrackerState(token), fetchManagerData(token)]);
  return (
    <ManagerDashboard
      user={user}
      tracker={tracker}
      orders={data.orders}
      customers={data.customers}
      stock={data.stock}
      transactions={data.transactions}
    />
  );
}
