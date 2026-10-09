import type { Metadata } from 'next';
import TelecallerDashboard from '../../components/TelecallerDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';
import { loadTelecallers } from '../../lib/telecallersServer';
import TelecallersSync from '../../components/TelecallersSync';
import { usingBackend } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Telecalling Staff',
};

export default async function TelecallerPage() {
  const user = await requireRole('telecaller');
  const [tracker, telecallers] = await Promise.all([getInitialTracker(user), loadTelecallers()]);
  return (
    <>
      <TelecallersSync list={telecallers} live={usingBackend()} />
      <TelecallerDashboard user={user} tracker={tracker} />
    </>
  );
}
