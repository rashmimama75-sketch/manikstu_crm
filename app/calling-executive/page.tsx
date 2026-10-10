import type { Metadata } from 'next';
import CallingExecutiveDashboard from '../../components/CallingExecutiveDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { loadSales, loadTelecallers } from '../../lib/telecallersServer';
import TelecallersSync from '../../components/TelecallersSync';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Calling Executive',
};

export default async function CallingExecutivePage() {
  const user = await requireRole('calling-executive');
  // loadTelecallers first: it clears the sample data that loadSales then replaces with the real sales
  const [tracker, telecallers, sales] = await Promise.all([getInitialTracker(user), loadTelecallers(), loadSales()]);
  return (
    <>
      <TelecallersSync list={telecallers} sales={sales} live={usingBackend()} />
      <CallingExecutiveDashboard user={user} tracker={tracker} />
    </>
  );
}
