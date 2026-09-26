import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { TELECALLERS } from '../data/managerDashboard';
import type { SessionUser } from './session';
import { Actor, ActionResult, TrackerAction, TrackerState, applyAction, sampleState } from './trackerOps';

// The telecalling data every dashboard shares. Until the backend's tracker tables are connected,
// it is kept in a local JSON file, starting from the sample data. Server-only.

const FILE = path.join(process.cwd(), '.data', 'tracker.json');

// Pages and API routes can each hold their own copy of this module, so re-read whenever the file changes.
let cache: { mtime: number; state: TrackerState } | null = null;

export function loadTracker(): TrackerState {
  let mtime: number;
  try {
    mtime = statSync(FILE).mtimeMs;
  } catch {
    cache = null; // nothing saved yet (or the file was removed to start over)
    return sampleState();
  }
  if (cache && cache.mtime === mtime) return cache.state;
  try {
    cache = { mtime, state: JSON.parse(readFileSync(FILE, 'utf8')) as TrackerState };
  } catch {
    return cache?.state ?? sampleState();
  }
  return cache.state;
}

function save(state: TrackerState) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, FILE); // replace in one step, so a crash can't leave half a file
  cache = { mtime: statSync(FILE).mtimeMs, state };
}

/** Applies a change for this user and saves it. Throws TrackerError with a readable message. */
export function changeTracker(action: TrackerAction, actor: Actor): ActionResult {
  const result = applyAction(loadTracker(), action, actor);
  save(result.state);
  return result;
}

/** The signed-in user as someone who changes tracker data. Calling executives are matched to their telecaller record by name. */
export function actorFor(user: SessionUser): Actor {
  return {
    role: user.role,
    name: user.name,
    callerId: user.role === 'calling-executive' ? TELECALLERS.find(t => t.name === user.name)?.id : undefined,
  };
}
