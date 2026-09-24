import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth';
import { ROLE_HOME } from '../lib/session';

export default async function Home() {
  const user = await getSession();
  redirect(user ? ROLE_HOME[user.role] : '/login');
}
