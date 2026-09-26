import type { Metadata } from 'next';
import ManagerDashboard from '../../components/ManagerDashboard';
import { requireRole } from '../../lib/auth';
import { actorFor, loadTracker } from '../../lib/trackerStore';
import { stateFor } from '../../lib/trackerOps';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Manager Dashboard',
};

export default async function ManagerPage() {
  const user = await requireRole('manager');
  const tracker = stateFor(loadTracker(), actorFor(user));
  return <ManagerDashboard user={user} tracker={tracker} />;
}
