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
    email: 'smurti@manikstu.in',
    name: 'Smurti Nayak',
    initials: 'SN',
    role: 'manager',
    staffId: 'MNK-MGR-042',
    // manager123
    passwordHash: 'eda874134d519c6317eead838eeae774:de6f6c800cef09fc4d1881826d7bafe161faee6fb06d195dd65d9abd537a301b',
  },
  {
    id: 'u-tl-101',
    email: 'pradeep@manikstu.in',
    name: 'Pradeep Mohanty',
    initials: 'PM',
    role: 'telecaller', // telecalling head: sees the whole telecalling team
    staffId: 'MK-TL-101',
    // telecaller123
    passwordHash: 'f715cb64b374a5f7e4ccba7db216329b:815b389ee853fa0520f6f24f51f52257c8e603873ccd5ede2f01139b330d3b9f',
  },
  {
    id: 'u-ce-212',
    email: 'bikash@manikstu.in',
    name: 'Bikash Pradhan',
    initials: 'BP',
    role: 'calling-executive',
    staffId: 'MK-CE-212',
    // executive123
    passwordHash: '96183426ca84d4bb62fb14fe7018b892:5f1bb04d9d96627a4625014f1c179396d7a10f118098256a0da2418598fe9daa',
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
