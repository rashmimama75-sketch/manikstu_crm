import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, usingBackend } from './backend';
import { actorFor, loadTracker } from './trackerStore';
import { stateFor, type TrackerState } from './trackerOps';
import type { SessionUser } from './session';

/**
 * The tracker state to render a dashboard with on the server. From the backend
 * (already scoped to this user) when one is configured, otherwise the local
 * sample data scoped here. Falls back to the sample if the backend is unreachable,
 * so the page still renders and the client picks up live data on its first poll.
 */
export async function getInitialTracker(user: SessionUser): Promise<TrackerState> {
  if (usingBackend()) {
    const token = cookies().get(TOKEN_COOKIE)?.value;
    if (token) {
      try {
        const r = await backendCall('/tracker', { token });
        if (r.ok) {
          const body = await r.json().catch(() => null);
          if (body && body.state) return body.state as TrackerState;
        }
      } catch {
        // fall through to the local sample
      }
    }
  }
  return stateFor(loadTracker(), actorFor(user));
}
