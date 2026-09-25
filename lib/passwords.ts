import { randomBytes, scryptSync } from 'crypto';

// Password hashes are "salt:scrypt(password, salt, 32)" in hex, the same format as lib/users.ts.

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

/** Why a password isn't acceptable, or null if it's fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return 'Password needs at least one letter and one number.';
  if (password.length > 128) return 'Password is too long.';
  return null;
}
