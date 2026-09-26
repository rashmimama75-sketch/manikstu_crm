import React from 'react';

/** Small "Live" indicator: shared telecalling data is being kept in sync with the server. */
export default function SyncBadge({ syncedAt, offline }: { syncedAt: Date | null; offline: boolean }) {
  const time = syncedAt ? syncedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : null;
  return (
    <span
      className={`sync-badge ${offline ? 'offline' : syncedAt ? 'live' : ''}`}
      title={offline ? 'Could not reach the server. Showing the last data received; retrying automatically.' : time ? `Up to date as of ${time}. Updates from the team appear automatically.` : 'Connecting…'}
      role="status"
    >
      <span className="sync-dot" />
      {offline ? 'Offline' : syncedAt ? 'Live' : 'Syncing'}
    </span>
  );
}
