import type { Metadata } from 'next';
import TelecallerDashboard from '../../components/TelecallerDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { loadSales, loadTelecallers } from '../../lib/telecallersServer';
import TelecallersSync from '../../components/TelecallersSync';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Telecalling Staff',
};

export default async function TelecallerPage() {
  const user = await requireRole('telecaller');
  // loadTelecallers first: it clears the sample data that loadSales then replaces with the real sales
  const [tracker, telecallers, sales] = await Promise.all([getInitialTracker(user), loadTelecallers(), loadSales()]);
  return (
    <>
      <TelecallersSync list={telecallers} sales={sales} live={usingBackend()} />
      <TelecallerDashboard user={user} tracker={tracker} />
    </>
  );
}
