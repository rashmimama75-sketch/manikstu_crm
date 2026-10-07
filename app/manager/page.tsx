import type { Metadata } from 'next';
import ManagerDashboard from '../../components/ManagerDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { getManagerData } from '../../lib/managerData';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Manager Dashboard',
};

export default async function ManagerPage() {
  const user = await requireRole('manager');
  const [tracker, data] = await Promise.all([getInitialTracker(user), getManagerData()]);
  return (
    <ManagerDashboard
      user={user}
      tracker={tracker}
      orders={data.orders}
      customers={data.customers}
      stock={data.stock}
      transactions={data.transactions}
      backend={usingBackend()}
    />
  );
}
