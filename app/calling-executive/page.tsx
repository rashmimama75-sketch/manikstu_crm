import type { Metadata } from 'next';
import CallingExecutiveDashboard from '../../components/CallingExecutiveDashboard';
import { requireRole } from '../../lib/auth';
import { getInitialTracker } from '../../lib/initialTracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Calling Executive',
};

export default async function CallingExecutivePage() {
  const user = await requireRole('calling-executive');
  const tracker = await getInitialTracker(user);
  return <CallingExecutiveDashboard user={user} tracker={tracker} />;
}
