'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Complaint } from '../data/complaints';
import { BackendComplaint, diffToPatch, fromBackend, toCreateBody } from './complaintsApi';

// The complaints a dashboard shows, kept in step with the CRM backend (the head sees every ticket, an executive only
// their own). Shaped like useState so the existing Complaints page works unchanged: a change shows straight away
// and is saved to the backend; if saving fails the list goes back to the server's version and onError gets the reason.
// Without a backend (offline demo) it is plain local state on the sample complaints.

const POLL_MS = 10000;

export interface ComplaintsSync {
  /** True once the first load finished (or the offline demo took over). */
  ready: boolean;
  /** False when there is no backend: changes stay on this screen only. */
  live: boolean;
  refresh: () => void;
  /** Save a new ticket; resolves with it as stored (real id and ticket number). Rejects with a readable reason. */
  create: (complaint: Complaint) => Promise<Complaint>;
}

export function useComplaints(
  fallback: Complaint[],
  onError: (message: string) => void,
): [Complaint[], Dispatch<SetStateAction<Complaint[]>>, ComplaintsSync] {
  const [list, setList] = useState<Complaint[]>(fallback);
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError; // the caller's toast changes every render; keep our callbacks stable
  const latest = useRef(list);
  latest.current = list;
  /** Saves in flight: a refresh in the middle would show the old version and undo what was just done. */
  const saving = useRef(0);
  const liveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/complaints', { cache: 'no-store' });
      if (res.status === 400) {
        // No backend configured: stay on the local sample.
        liveRef.current = false;
        setLive(false);
        setReady(true);
        return;
      }
      if (!res.ok) return;
      const body = await res.json();
      if (saving.current === 0 && Array.isArray(body.data)) {
        setList((body.data as BackendComplaint[]).map(fromBackend));
      }
      setReady(true);
    } catch {
      /* server briefly unreachable: keep what is on screen and try again */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible' && liveRef.current) load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const setComplaints = useCallback<Dispatch<SetStateAction<Complaint[]>>>(update => {
    const before = latest.current;
    const next = typeof update === 'function' ? update(before) : update;
    latest.current = next;
    setList(next);
    if (!liveRef.current) return;

    const requests: { run: () => Promise<Response>; tempId?: number }[] = [];
    for (const c of next) {
      const old = before.find(x => x.id === c.id);
      if (!old) {
        requests.push({
          tempId: c.id,
          run: () => fetch('/api/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toCreateBody(c)) }),
        });
        continue;
      }
      const change = diffToPatch(old, c);
      if (change) {
        requests.push({
          run: () => fetch(`/api/complaints/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) }),
        });
      }
    }
    if (requests.length === 0) return;

    saving.current++;
    (async () => {
      try {
        for (const r of requests) {
          const res = await r.run();
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? body.message ?? 'Could not save the change.');
          const saved = fromBackend(body.data as BackendComplaint);
          // Put the server's version in place (a new ticket swaps its temporary id for the real one).
          setList(cur => cur.map(c => (c.id === (r.tempId ?? saved.id) ? saved : c)));
        }
      } catch (e) {
        onErrorRef.current((e as Error).message);
      } finally {
        saving.current--;
        if (saving.current === 0) load(); // on failure this puts back what the server really has
      }
    })();
  }, [load]);

  const create = useCallback(async (c: Complaint): Promise<Complaint> => {
    if (!liveRef.current) {
      setList(cur => [c, ...cur]);
      return c;
    }
    saving.current++;
    try {
      const res = await fetch('/api/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toCreateBody(c)) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? body.message ?? 'Could not save the complaint.');
      const saved = fromBackend(body.data as BackendComplaint);
      setList(cur => [saved, ...cur.filter(x => x.id !== saved.id)]);
      return saved;
    } finally {
      saving.current--;
    }
  }, []);

  return [list, setComplaints, { ready, live, refresh: load, create }];
}
