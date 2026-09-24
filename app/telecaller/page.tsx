import type { Metadata } from 'next';
import TelecallerDashboard from '../../components/TelecallerDashboard';
import { requireRole } from '../../lib/auth';

export const metadata: Metadata = {
  title: 'Manikstu Telecalling Staff',
};

export default async function TelecallerPage() {
  const user = await requireRole('telecaller');
  return <TelecallerDashboard user={user} />;
}
