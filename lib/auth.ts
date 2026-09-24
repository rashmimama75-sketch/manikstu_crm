import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROLE_HOME, SESSION_COOKIE, verifySessionToken, type Role, type SessionUser } from './session';

export async function getSession(): Promise<SessionUser | null> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

// Server-side guard for pages; middleware already redirects, this is the backstop.
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
