import { scryptSync, timingSafeEqual } from 'crypto';
import type { SessionUser } from './session';

// Demo user store. Replace with a database lookup before going live.
// passwordHash is "salt:scrypt(password, salt, 32)" in hex.
interface UserRecord extends SessionUser {
  email: string;
  passwordHash: string;
}

const USERS: UserRecord[] = [
  {
    id: 'u-mgr-042',
    email: 'smurti@maniksthu.in',
    name: 'Smurti Nayak',
    initials: 'SN',
    role: 'manager',
    staffId: 'MNK-MGR-042',
    // manager123
    passwordHash: 'eda874134d519c6317eead838eeae774:de6f6c800cef09fc4d1881826d7bafe161faee6fb06d195dd65d9abd537a301b',
  },
  {
    id: 'u-tc-112',
    email: 'ananya@maniksthu.in',
    name: 'Ananya Mishra',
    initials: 'AM',
    role: 'telecaller',
    staffId: 'MK-TC-112',
    // telecaller123
    passwordHash: 'f715cb64b374a5f7e4ccba7db216329b:815b389ee853fa0520f6f24f51f52257c8e603873ccd5ede2f01139b330d3b9f',
  },
];

function passwordMatches(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export function authenticate(email: string, password: string): SessionUser | null {
  const record = USERS.find(u => u.email === email.trim().toLowerCase());
  if (!record || !passwordMatches(password, record.passwordHash)) return null;
  const { email: _email, passwordHash: _hash, ...user } = record;
  return user;
}
