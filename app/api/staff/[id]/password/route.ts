import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiUser } from '../../../../../lib/auth';
import { passwordProblem } from '../../../../../lib/passwords';
import { resetPassword } from '../../../../../lib/staffAccounts';
import { TOKEN_COOKIE, backendCall, relay, usingBackend } from '../../../../../lib/backend';

// The head sets a new temporary password. It's stored hashed and never sent back.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (usingBackend()) {
    const token = cookies().get(TOKEN_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    let password = '';
    try {
      password = String((await request.json()).password ?? '');
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    try {
      const r = await backendCall(`/telecalling/staff/${params.id}/password`, { method: 'POST', token, body: { password } });
      return await relay(r, 'Could not reset the password.');
    } catch {
      return NextResponse.json({ error: 'Could not reach the server.' }, { status: 502 });
    }
  }

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
