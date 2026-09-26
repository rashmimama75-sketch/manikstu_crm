import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { actorFor, changeTracker, loadTracker } from '../../../lib/trackerStore';
import { TrackerAction, TrackerError, stateFor } from '../../../lib/trackerOps';

export const dynamic = 'force-dynamic';

// Shared telecalling data for all three dashboards.
// GET  ?since=<version>  → { version } only if nothing changed, otherwise the full data
// POST { action }        → applies one change and returns the new data

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const state = loadTracker();
  const since = new URL(request.url).searchParams.get('since');
  if (since !== null && since !== '' && Number(since) === state.version) return NextResponse.json({ version: state.version, unchanged: true });
  return NextResponse.json({ state: stateFor(state, actorFor(user)) });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  let action: TrackerAction;
  try {
    action = (await request.json()).action;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const actor = actorFor(user);
  if (actor.role === 'calling-executive' && actor.callerId === undefined) {
    return NextResponse.json({ error: 'Your login is not linked to a telecaller record.' }, { status: 403 });
  }
  try {
    const result = changeTracker(action, actor);
    return NextResponse.json({ state: stateFor(result.state, actor), message: result.message, createdIds: result.createdIds ?? [] });
  } catch (err) {
    if (err instanceof TrackerError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error('Tracker change failed:', err);
    return NextResponse.json({ error: 'Could not save the change. Please try again.' }, { status: 500 });
  }
}
