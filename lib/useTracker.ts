'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackerAction, TrackerState } from './trackerOps';

// Keeps a dashboard's copy of the shared telecalling data in step with the server:
// checks for changes every few seconds (and when the tab comes back into view), and sends changes.

const POLL_MS = 5000;

export interface TrackerSync {
  data: TrackerState;
  /** Send a change; resolves with the server's message and any new lead ids, or rejects with a readable error. */
  run: (action: TrackerAction) => Promise<{ message: string; createdIds: number[] }>;
  /** When the data was last confirmed up to date. */
  syncedAt: Date | null;
  offline: boolean;
}

export function useTracker(initial: TrackerState): TrackerSync {
  const [data, setData] = useState(initial);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [offline, setOffline] = useState(false);
  const version = useRef(initial.version);

  const accept = useCallback((state: TrackerState) => {
    // Ignore a slower, older response arriving after a newer one.
    if (state.version < version.current) return;
    version.current = state.version;
    setData(state);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracker?since=${version.current}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      if (body.state) accept(body.state);
      setSyncedAt(new Date());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [accept]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  const run = useCallback(async (action: TrackerAction) => {
    let res: Response;
    try {
      res = await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? 'Could not save the change. Please try again.');
    accept(body.state);
    setSyncedAt(new Date());
    setOffline(false);
    return { message: body.message as string, createdIds: (body.createdIds ?? []) as number[] };
  }, [accept]);

  return { data, run, syncedAt, offline };
}
