import React from 'react';
import { Sun, Moon, Bell, Search } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  unreadNotifsCount: number;
  onToggleNotifs: () => void;
  onQuickAction: () => void;
  /** Shown at the start of the tools, e.g. the live-sync indicator. */
  status?: React.ReactNode;
}

export default function Topbar({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  theme,
  onToggleTheme,
  unreadNotifsCount,
  onToggleNotifs,
  onQuickAction,
  status
}: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        <h1 id="page-title">{title}</h1>
        <div className="sub" id="page-sub">{subtitle}</div>
      </div>
      <div className="topbar-tools">
        {status}
        <form
          className="search"
          onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
        >
          <Search size={16} style={{ color: 'var(--ink-soft)' }} />
          <input
            type="text"
            placeholder="Search orders, enquiries, farmers, products… (Enter to jump)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </form>

        <button
          className="icon-btn"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          onClick={onToggleTheme}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="icon-btn"
          title="Manager Notifications"
          onClick={onToggleNotifs}
        >
          <Bell size={18} />
          {unreadNotifsCount > 0 && <span className="badge">{unreadNotifsCount}</span>}
        </button>

        <button
          className="btn-primary"
          onClick={onQuickAction}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          + Manager Action
        </button>
      </div>
    </div>
  );
}
