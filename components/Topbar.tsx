import React from 'react';
import { Bell, Search, UserRound } from 'lucide-react';
import LogoutButton from './LogoutButton';

interface TopbarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  unreadNotifsCount: number;
  onToggleNotifs: () => void;
  /** Shown at the start of the tools, e.g. the live-sync indicator. */
  status?: React.ReactNode;
}

export default function Topbar({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  unreadNotifsCount,
  onToggleNotifs,
  status
}: TopbarProps) {
  return (
    <>
      {/* Search on the left, tools on the right, in one card that stays at the top */}
      <div className="topbar-sticky">
        <div className="topbar-card">
          <form
            className="search"
            onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
          >
            <Search size={16} style={{ color: 'var(--ink-soft)' }} />
            <input
              type="text"
              placeholder="Search orders, farmers… (Enter to jump)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </form>

          <div className="topbar-tools">
            {status}
            <button
              className="icon-btn"
              title="Manager Notifications"
              onClick={onToggleNotifs}
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && <span className="badge">{unreadNotifsCount}</span>}
            </button>
            <div className="topbar-profile">
              <div className="avatar"><UserRound size={18} /></div>
              <div>
                <div className="who-name">Manager Portal</div>
                <div className="who-role">Manikstu Samarth</div>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="page-head">
        <h1 id="page-title">{title}</h1>
        <div className="sub" id="page-sub">{subtitle}</div>
      </div>
    </>
  );
}
