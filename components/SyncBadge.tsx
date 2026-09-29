import React from 'react';

/** Shown only when shared telecalling data can't reach the server; stays hidden while syncing normally. */
export default function SyncBadge({ syncedAt, offline }: { syncedAt: Date | null; offline: boolean }) {
  if (!offline) return null;
  const time = syncedAt ? syncedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : null;
  return (
    <span
      className="sync-badge offline"
      title={`Could not reach the server. Showing the last data received${time ? ` (as of ${time})` : ''}; retrying automatically.`}
      role="status"
    >
      <span className="sync-dot" />
      Offline
    </span>
  );
}
