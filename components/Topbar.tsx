import React from 'react';
import { Sun, Moon, Bell, Search, User, ShieldCheck } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  unreadNotifsCount: number;
  onToggleNotifs: () => void;
  onOpenProfile: () => void;
  onQuickAction: () => void;
}

export default function Topbar({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  unreadNotifsCount,
  onToggleNotifs,
  onOpenProfile,
  onQuickAction
}: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        <h1 id="page-title">{title}</h1>
        <div className="sub" id="page-sub">{subtitle}</div>
      </div>
      <div className="topbar-tools">
        <div className="search">
          <Search size={16} style={{ color: 'var(--ink-soft)' }} />
          <input
            type="text"
            placeholder="Search orders, leads, farmers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

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

        <div className="who" onClick={onOpenProfile} title="Manager Profile Details">
          <div className="avatar">SN</div>
          <div>
            <div className="who-name">Smurti Nayak</div>
            <div className="who-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} color="var(--gold)" /> Territory Manager
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
