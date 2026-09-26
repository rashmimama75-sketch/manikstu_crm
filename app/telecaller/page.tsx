import type { Metadata } from 'next';
import TelecallerDashboard from '../../components/TelecallerDashboard';
import { requireRole } from '../../lib/auth';
import { actorFor, loadTracker } from '../../lib/trackerStore';
import { stateFor } from '../../lib/trackerOps';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Telecalling Staff',
};

export default async function TelecallerPage() {
  const user = await requireRole('telecaller');
  const tracker = stateFor(loadTracker(), actorFor(user));
  return <TelecallerDashboard user={user} tracker={tracker} />;
}
