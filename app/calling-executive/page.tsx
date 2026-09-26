import type { Metadata } from 'next';
import CallingExecutiveDashboard from '../../components/CallingExecutiveDashboard';
import { requireRole } from '../../lib/auth';
import { actorFor, loadTracker } from '../../lib/trackerStore';
import { stateFor } from '../../lib/trackerOps';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Calling Executive',
};

export default async function CallingExecutivePage() {
  const user = await requireRole('calling-executive');
  const tracker = stateFor(loadTracker(), actorFor(user));
  return <CallingExecutiveDashboard user={user} tracker={tracker} />;
}
