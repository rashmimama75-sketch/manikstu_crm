import { NextResponse } from 'next/server';
import { apiUser } from '../../../../../lib/auth';
import { passwordProblem } from '../../../../../lib/passwords';
import { resetPassword } from '../../../../../lib/staffAccounts';

// The head sets a new temporary password. It's stored hashed and never sent back.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser('telecaller'))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

  let password = '';
  try {
    password = String((await request.json()).password ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const account = resetPassword(params.id, password);
  if (!account) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
  return NextResponse.json({ data: account });
}
