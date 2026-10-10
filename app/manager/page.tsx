import type { Metadata } from 'next';
import ManagerDashboard from '../../components/ManagerDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { loadSales, loadTelecallers } from '../../lib/telecallersServer';
import TelecallersSync from '../../components/TelecallersSync';
import { getManagerData } from '../../lib/managerData';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Manager Dashboard',
};

export default async function ManagerPage() {
  const user = await requireRole('manager');
  // loadTelecallers first: it clears the sample data that loadSales then replaces with the real sales
  const [tracker, data, telecallers, sales] = await Promise.all([getInitialTracker(user), getManagerData(), loadTelecallers(), loadSales()]);
  return (
    <>
    <TelecallersSync list={telecallers} sales={sales} live={usingBackend()} />
    <ManagerDashboard
      user={user}
      tracker={tracker}
      orders={data.orders}
      orderReport={data.orderReport}
      customers={data.customers}
      stock={data.stock}
      transactions={data.transactions}
      backend={usingBackend()}
    />
    </>
  );
}
