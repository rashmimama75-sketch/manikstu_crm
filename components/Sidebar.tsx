import React from 'react';

interface SidebarProps {
  activePage: string;
  onSelectPage: (pageKey: string) => void;
  counts: {
    orders: number;
    enquiries: number;
    staff: number;
  };
}

export default function Sidebar({ activePage, onSelectPage, counts }: SidebarProps) {
  const groups = [
    {
      label: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard' }
      ]
    },
    {
      label: 'Operations',
      items: [
        { key: 'orders', label: 'Orders', count: counts.orders },
        { key: 'enquiries', label: 'Enquiries', count: counts.enquiries },
        { key: 'customers', label: 'Customers' },
        { key: 'products', label: 'Products' }
      ]
    },
    {
      label: 'People & Staff',
      items: [
        { key: 'staffonboarding', label: 'Staff onboarding', count: counts.staff }
      ]
    },
    {
      label: 'Network & Partners',
      items: [
        { key: 'franchise', label: 'Franchise Hubs' },
        { key: 'fpo', label: 'FPO Collectives' }
      ]
    },
    {
      label: 'Inventory & Finance',
      items: [
        { key: 'inventory', label: 'Central inventory' },
        { key: 'monetary', label: 'Monetary section' }
      ]
    },
    {
      label: 'Insights & Approvals',
      items: [
        { key: 'reports', label: 'Reports & Analytics' }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {groups.map((group, idx) => (
        <div key={idx} className="nav-group">
          <div className="nav-group-label">{group.label}</div>
          {group.items.map((item) => {
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPage(item.key)}
              >
                <span className="dot"></span>
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className="count">{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
