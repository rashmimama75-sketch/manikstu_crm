import React from 'react';
import {
  BarChart3,
  Headphones,
  LayoutDashboard,
  MapPin,
  PhoneCall,
  ShoppingCart,
  Sprout,
  Store,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onSelectPage: (pageKey: string) => void;
  counts: {
    orders: number;
    telecalling?: number;
  };
}

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  /** Not live yet: shows a "Soon" tag. */
  soon?: boolean;
}

export default function Sidebar({ activePage, onSelectPage, counts }: SidebarProps) {
  const groups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: 'Operations',
      items: [
        { key: 'orders', label: 'Orders', icon: ShoppingCart, count: counts.orders },
        { key: 'customers', label: 'Customers', icon: Users },
        { key: 'regional', label: 'Regional report', icon: MapPin }
      ]
    },
    {
      label: 'Telecalling',
      items: [
        { key: 'tc-overview', label: 'Team overview', icon: Headphones, count: counts.telecalling },
        { key: 'tc-executives', label: 'Telecalling executives', icon: PhoneCall }
      ]
    },
    {
      label: 'Network & Partners',
      items: [
        { key: 'franchise', label: 'Franchise Hubs', icon: Store, soon: true },
        { key: 'fpo', label: 'FPO Collectives', icon: Sprout, soon: true }
      ]
    },
    {
      label: 'Inventory & Finance',
      items: [
        { key: 'inventory', label: 'Central inventory', icon: Warehouse },
        { key: 'monetary', label: 'Monetary section', icon: Wallet }
      ]
    },
    {
      label: 'Insights & Approvals',
      items: [
        { key: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="brand-logo" src="/brand/manikstu-logo-horizontal-negative.png" alt="Manikstu" />
      </div>

      <nav className="sidebar-nav">
        {groups.map((group, idx) => (
          <div key={idx} className="nav-group">
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((item) => {
              const isActive = activePage === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={`nav-item ${isActive ? 'active' : ''}`}
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
