import type { Metadata } from 'next';
import TelecallerDashboard from '../../components/TelecallerDashboard';
import { requireRole } from '../../lib/auth';
import { fetchTrackerState, getApiToken } from '../../lib/backend';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Telecalling Staff',
};

export default async function TelecallerPage() {
  const user = await requireRole('telecaller');
  const tracker = await fetchTrackerState(getApiToken());
  return <TelecallerDashboard user={user} tracker={tracker} />;
}
