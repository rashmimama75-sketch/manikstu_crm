import type { Metadata } from 'next';
import ManagerDashboard from '../../components/ManagerDashboard';
import { requireRole } from '../../lib/auth';

export const metadata: Metadata = {
  title: 'Manikstu Manager Dashboard',
};

export default async function ManagerPage() {
  const user = await requireRole('manager');
  return <ManagerDashboard user={user} />;
}
