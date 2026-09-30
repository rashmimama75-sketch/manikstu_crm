import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  /** Not live yet: shows a "Soon" tag. */
  soon?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activePage: string;
  onSelectPage: (pageKey: string) => void;
}

/** Green sidebar shared by every dashboard: logo, then grouped pages with icons and counts. */
export default function Sidebar({ groups, activePage, onSelectPage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="brand-logo" src="/brand/manikstu-logo-horizontal-negative.png" alt="Manikstu" />
      </div>

      <nav className="sidebar-nav">
        {groups.map(group => (
          <div key={group.label} className="nav-group">
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                  onClick={() => onSelectPage(item.key)}
                >
                  <Icon className="nav-icon" size={17} />
                  {item.label}
                  {item.soon && <span className="soon">Soon</span>}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="count" suppressHydrationWarning>{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
