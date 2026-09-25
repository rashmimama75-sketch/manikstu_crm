import { NextResponse } from 'next/server';
import { apiUser } from '../../../lib/auth';
import { passwordProblem } from '../../../lib/passwords';
import { createAccount, duplicateProblem, listAccounts } from '../../../lib/staffAccounts';

export const dynamic = 'force-dynamic';

// Staff onboarding: the telecalling head (telecaller login) lists and adds telecalling staff.

export async function GET() {
  if (!(await apiUser('telecaller'))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  return NextResponse.json({ data: listAccounts() });
}

export async function POST(request: Request) {
  const head = await apiUser('telecaller');
  if (!head) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim();
  const mobile = String(body.mobile ?? '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  const email = String(body.email ?? '').trim().toLowerCase() || null;
  const region = String(body.region ?? '').trim();
  const verticalIds = Array.isArray(body.verticalIds) ? body.verticalIds.map(Number).filter(n => [1, 2, 3].includes(n)) : [];
  const dailyTarget = Math.round(Number(body.dailyTarget));
  const password = String(body.password ?? '');

  const problem =
    name.length < 3 || name.length > 60 ? 'Enter the full name (3–60 characters).'
    : !/^[6-9]\d{9}$/.test(mobile) ? 'Enter a valid 10-digit mobile number.'
    : email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address, or leave it empty.'
    : !region || region.length > 40 ? 'Choose a region.'
    : verticalIds.length === 0 ? 'Choose at least one product line.'
    : !(dailyTarget >= 5 && dailyTarget <= 200) ? 'Daily call target should be between 5 and 200.'
    : passwordProblem(password) ?? duplicateProblem(mobile, email);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const account = createAccount({ name, mobile, email, region, verticalIds, dailyTarget, password }, head.name);
  return NextResponse.json({ data: account }, { status: 201 });
}
