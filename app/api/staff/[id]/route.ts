import { NextResponse } from 'next/server';
import { apiUser } from '../../../../lib/auth';
import { setAccountFlags } from '../../../../lib/staffAccounts';

// Activate / deactivate a staff member, or tick onboarding steps.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser('telecaller'))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const flags: { isActive?: boolean; detailsShared?: boolean; trainingDone?: boolean } = {};
  for (const key of ['isActive', 'detailsShared', 'trainingDone'] as const) {
    if (typeof body[key] === 'boolean') flags[key] = body[key] as boolean;
  }
  if (Object.keys(flags).length === 0) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 });

  const account = setAccountFlags(params.id, flags);
  if (!account) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
  return NextResponse.json({ data: account });
}
