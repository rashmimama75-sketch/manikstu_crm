import type { Metadata } from 'next';
import CallingExecutiveDashboard from '../../components/CallingExecutiveDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { loadTelecallers } from '../../lib/telecallersServer';
import TelecallersSync from '../../components/TelecallersSync';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Calling Executive',
};

export default async function CallingExecutivePage() {
  const user = await requireRole('calling-executive');
  const [tracker, telecallers] = await Promise.all([getInitialTracker(user), loadTelecallers()]);
  return (
    <>
      <TelecallersSync list={telecallers} live={usingBackend()} />
      <CallingExecutiveDashboard user={user} tracker={tracker} />
    </>
  );
}
