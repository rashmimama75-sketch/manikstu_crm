'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import HeaderFrieze from './HeaderFrieze';
import FooterFrieze from './FooterFrieze';
import NotificationsDrawer from './NotificationsDrawer';
import LogoutButton from './LogoutButton';
import TeamOverview from './telecaller/TeamOverview';
import TeamLeads from './telecaller/TeamLeads';
import TeamFollowups from './telecaller/TeamFollowups';
import TeamSales from './telecaller/TeamSales';
import StaffOnboarding from './telecaller/StaffOnboarding';
import TelecallingExecutivesView from './views/TelecallingExecutivesView';
import RegionalReportView from './views/RegionalReportView';
import EnquiriesView from './views/EnquiriesView';
import TeamReports from './telecaller/TeamReports';
import TeamComplaints from './telecaller/TeamComplaints';
import TeamOrders from './telecaller/TeamOrders';
import TeamInventory from './telecaller/TeamInventory';
import { trackingFor } from './telecaller/orderTracking';
import { Complaint, INITIAL_COMPLAINTS } from '../data/complaints';
import { isUnassigned } from './telecaller/complaintsUtil';
import {
  SALES_ORDERS,
  TELECALLERS,
  TRACKER_SALES,
  VERTICALS,
  WebEnquiry,
} from '../data/managerDashboard';
import { detectVertical } from '../lib/leadImport';
import type { NewEnquiryData, TrackerState } from '../lib/trackerOps';
import { useSharedEnquiries, useTracker } from '../lib/useTracker';
import SyncBadge from './SyncBadge';
import type { NewLead } from './telecaller/ImportLeads';
import { TeamData, isOverdue, staffStats, teamAlerts } from './telecaller/tcData';
import type { SessionUser } from '../lib/session';

/**
 * Head telecalling dashboard: the telecalling head's view of the whole telecalling team.
 * Works on the same tracker data the manager sees (all telecallers' leads, calls, follow-ups, sales).
 */
export default function TelecallerDashboard({ user, tracker }: { user: SessionUser; tracker: TrackerState }) {
  const firstName = user.name.split(' ')[0];

  const [activePage, setActivePage] = useState('overview');
  const [focusCaller, setFocusCaller] = useState<number | undefined>(undefined);
  /** Executive open on the Executive reports page (null = the list). */
  const [reportExec, setReportExec] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Leads, calls and follow-ups are shared with the calling executives and the manager (kept in sync
  // with the server). Importing and assigning leads change them here; calls come in from the executives.
  const sync = useTracker(tracker);
  const { leads, followups, activities } = sync.data;
  // Website enquiries: the same list as the manager's Enquiries page (shared through the server)
  const [enquiries, setEnquiries] = useSharedEnquiries(sync, msg => showToast(`⚠️ ${msg}`));
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const data: TeamData = useMemo(
    () => ({ leads, followups, activities, sales: TRACKER_SALES }),
    [leads, followups, activities],
  );

  const todayStats = useMemo(() => staffStats(data, 'today', 'all'), [data]);
  const alerts = useMemo(() => teamAlerts(todayStats), [todayStats]);

  const [alertsCleared, setAlertsCleared] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const notifications = alertsCleared
    ? []
    : alerts.map(a => ({
        id: a.key,
        title: a.level === 'critical' ? 'Action needed' : 'Heads up',
        message: a.text,
        time: 'Today',
        type: a.level === 'critical' ? ('warning' as const) : ('info' as const),
      }));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pageMeta: Record<string, { title: string; sub: string }> = {
    overview:   { title: 'Telecalling Team',     sub: `Good day, ${firstName}. Here's how the whole telecalling team is doing.` },
    leads:      { title: 'Leads & Assignment',   sub: 'Every lead across the team: find untouched ones and move them to someone with capacity.' },
    followups:  { title: 'Team Follow-ups',      sub: 'Who owes a callback, and who is falling behind.' },
    regional:   { title: 'Regional Report',      sub: 'Orders by state, district and town: see what farmers bought in each area and download it.' },
    sales:      { title: 'Team Sales',           sub: 'What the team has sold, by telecaller, product and month.' },
    'exec-reports': { title: 'Executive Reports', sub: 'Every telecalling executive: calls, leads, follow-ups and sales. Open one for the full report, or download reports.' },
    onboarding: { title: 'Staff Onboarding',     sub: 'Add telecalling staff and create their Staff ID and temporary password.' },
    inventory:  { title: 'Stock',                sub: 'What the team can sell today, what is running out and which customers are waiting.' },
    orders:     { title: 'Orders & Tracking',    sub: 'What each customer bought and where the parcel is: packed, shipped, out for delivery, delivered.' },
    enquiries:  { title: 'Website Enquiries',    sub: 'Messages from the website contact form: reply, and assign them to a caller as leads.' },
    reports:    { title: 'Reports & Analytics',  sub: 'Generate and export telecalling, sales, order, stock and support reports as Excel or PDF.' },
    complaints: { title: 'Complaints',           sub: 'Assign each customer complaint to the right telecaller and see it through to resolution.' },
  };
  const currentMeta = pageMeta[activePage] || pageMeta.overview;

  const overdueCount = followups.filter(isOverdue).length;
  const withInactive = todayStats.filter(s => !s.t.is_active).reduce((a, s) => a + s.openLeads, 0);
  const lateOrders = useMemo(() => SALES_ORDERS.filter(o => trackingFor(o).delayed).length, []);
  const toAssign = complaints.filter(isUnassigned).length;

  const navGroups = [
    { label: 'Overview', items: [{ key: 'overview', label: 'Team overview', count: alerts.filter(a => a.level === 'critical').length }] },
    {
      label: 'Team',
      items: [
        { key: 'leads', label: 'Leads & assignment', count: withInactive },
        { key: 'followups', label: 'Follow-ups', count: overdueCount },
        { key: 'exec-reports', label: 'Executive reports' },
        { key: 'onboarding', label: 'Staff onboarding' },
      ],
    },
    { label: 'Performance', items: [{ key: 'sales', label: 'Sales' }, { key: 'regional', label: 'Regional report' }] },
    {
      label: 'Inventory',
      items: [
        { key: 'inventory', label: 'Stock' },
        { key: 'orders', label: 'Orders & tracking', count: lateOrders },
      ],
    },
    {
      label: 'Support',
      items: [
        { key: 'enquiries', label: 'Enquiries', count: enquiries.filter(e => e.status === 'new').length },
        { key: 'complaints', label: 'Complaints', count: toAssign },
      ],
    },
    { label: 'Reports', items: [{ key: 'reports', label: 'Reports & Analytics' }] },
  ];

  const handleNavigate = (page: string, callerId?: number) => {
    setActivePage(page);
    setFocusCaller(callerId);
    if (page === 'exec-reports') setReportExec(callerId ?? null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  /** Move leads (and their pending follow-ups) to another telecaller. */
  const handleReassign = async (leadIds: number[], toCallerId: number) => {
    try {
      const { message } = await sync.run({ type: 'assign', leadIds, callerId: toCallerId });
      showToast(message);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  /**
   * Website enquiries → a telecaller: new ones become leads (product line chosen, or read from each
   * message), enquiries that are already leads (same id or phone) move to the caller. True when saved.
   */
  const handleAssignEnquiries = async (list: WebEnquiry[], callerId: number, verticalId: number | 'auto') => {
    const caller = TELECALLERS.find(t => t.id === callerId)?.name ?? 'the caller';
    const withPhone = list.filter(e => e.phone);
    const leadOf = (e: WebEnquiry) =>
      (e.lead_id !== null ? leads.find(l => l.id === e.lead_id) : undefined) ?? leads.find(l => l.phone === e.phone);
    const existing = withPhone.map(e => ({ e, lead: leadOf(e) })).filter(x => x.lead);
    // One lead per phone number, even if the same person sent several enquiries
    const fresh = withPhone.filter(e => !leadOf(e)).filter((e, i, all) => all.findIndex(x => x.phone === e.phone) === i);
    try {
      const links = new Map<number, number>(); // enquiry id → lead id
      if (fresh.length) {
        const { createdIds } = await sync.run({
          type: 'import-leads',
          leads: fresh.map(e => ({
            vertical_id: verticalId === 'auto' ? detectVertical(`${e.message} ${e.type}`) ?? VERTICALS[0].id : verticalId,
            assigned_to: callerId,
            customer_name: e.name,
            phone: e.phone!,
            source: 'Website',
          })),
        });
        fresh.forEach((e, i) => links.set(e.id, createdIds[i]));
        withPhone.forEach(e => { const twin = fresh.find(x => x.phone === e.phone); if (twin && !links.has(e.id)) links.set(e.id, links.get(twin.id)!); });
      }
      const toMove = existing.filter(x => x.lead!.assigned_to !== callerId).map(x => x.lead!.id);
      if (toMove.length) await sync.run({ type: 'assign', leadIds: Array.from(new Set(toMove)), callerId });
      existing.forEach(x => links.set(x.e.id, x.lead!.id));
      const changes = list.filter(e => links.has(e.id)).map(e => ({
        id: e.id,
        patch: { lead_id: links.get(e.id)!, ...(e.status === 'new' ? { status: 'read' as const } : {}) },
      }));
      if (changes.length) await sync.run({ type: 'update-enquiries', changes });
      const skipped = list.length - withPhone.length;
      showToast(`${links.size} ${links.size === 1 ? 'enquiry' : 'enquiries'} assigned to ${caller}${skipped ? ` · ${skipped} skipped (no phone)` : ''}`);
      return true;
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
      return false;
    }
  };

  /** Enquiries imported from a file; optionally the sales ones go straight to a caller. True when saved. */
  const handleImportEnquiries = async (list: NewEnquiryData[], assignSalesTo: number | null) => {
    try {
      const { message, createdIds } = await sync.run({ type: 'import-enquiries', enquiries: list });
      showToast(message);
      if (assignSalesTo !== null) {
        const sales: WebEnquiry[] = list
          .map((e, i) => ({ ...e, id: createdIds[i], status: 'new' as const, admin_notes: null, replied_at: null, customer_id: null, lead_id: null, created_at: e.created_at ?? '' }))
          .filter(e => e.type === 'sales');
        if (sales.length) await handleAssignEnquiries(sales, assignSalesTo, 'auto');
      }
      return true;
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
      return false;
    }
  };

  /** Create leads from an imported Excel / PDF file, in the first stage of their product line. */
  const handleImport = async (newLeads: NewLead[]) => {
    try {
      const { message } = await sync.run({ type: 'import-leads', leads: newLeads });
      showToast(message);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <div>
      {toastMessage && <div className={`toast ${toastMessage.startsWith('⚠️') ? 'toast-error' : ''}`}>{toastMessage.startsWith('⚠️') ? toastMessage : `✅ ${toastMessage}`}</div>}

      <div className="app-header">
      <div className="masthead">
        <div className="masthead-bar">
          <div className="brand">
            <div className="brand-mark">🌾</div>
            <div>
              <div className="brand-name">Manikstu Telecalling</div>
              <div className="brand-tag">
                <span>Head Telecalling Dashboard</span>
                <span className="manager-badge">Telecalling Head</span>
              </div>
            </div>
          </div>
          <div className="masthead-right">
            <span>Shift · 9:00–18:00</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Staff ID: {user.staffId}</span>

            <div className="masthead-user">
              <div className="who" style={{ cursor: 'default' }}>
                <div className="avatar">{user.initials}</div>
                <div>
                  <div className="who-name">{user.name}</div>
                  <div className="who-role">Telecalling Head</div>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <HeaderFrieze />
      </div>

      <div className="shell">
        <aside className="sidebar">
          {navGroups.map(group => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.key)}
                >
                  <span className="dot"></span>
                  {item.label}
                  {'count' in item && item.count !== undefined && item.count > 0 && (
                    <span className="count" suppressHydrationWarning>{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <h1>{currentMeta.title}</h1>
              <div className="sub">{currentMeta.sub}</div>
            </div>
            <div className="topbar-tools">
              <SyncBadge syncedAt={sync.syncedAt} offline={sync.offline} />
              <div className="search">
                <Search size={16} style={{ color: 'var(--ink-soft)' }} />
                <input
                  type="text"
                  placeholder={activePage === 'complaints' ? 'Search complaints by name, phone, ticket…' : activePage === 'inventory' ? 'Search products…' : activePage === 'exec-reports' ? 'Search executives by name or region…' : activePage === 'orders' ? 'Search orders by name, phone, order no., AWB…' : 'Search leads by name or phone…'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activePage !== 'leads' && activePage !== 'followups' && activePage !== 'complaints' && activePage !== 'orders' && activePage !== 'inventory' && activePage !== 'exec-reports') {
                      setActivePage('leads');
                      setFocusCaller(undefined);
                    }
                  }}
                />
              </div>
              <button
                className="icon-btn"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button className="icon-btn" title="Team alerts" onClick={() => setIsNotifsOpen(o => !o)}>
                <Bell size={18} />
                {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
              </button>
            </div>
          </div>

          {activePage === 'overview' && (
            <TeamOverview
              data={data}
              orders={SALES_ORDERS}
              enquiries={enquiries}
              onReassign={handleReassign}
              onOpenLeads={callerId => handleNavigate('leads', callerId)}
              onOpenFollowups={callerId => handleNavigate('followups', callerId)}
              onToast={showToast}
            />
          )}
          {activePage === 'leads' && (
            <TeamLeads key={`leads-${focusCaller ?? 'all'}`} data={data} searchQuery={searchQuery} initialCaller={focusCaller} onReassign={handleReassign} onImport={handleImport} onToast={showToast} />
          )}
          {activePage === 'followups' && (
            <TeamFollowups key={`fu-${focusCaller ?? 'all'}`} data={data} searchQuery={searchQuery} initialCaller={focusCaller} onReassign={handleReassign} onToast={showToast} />
          )}
          {activePage === 'regional' && (
            <RegionalReportView
              orders={SALES_ORDERS}
              onOpenOrder={orderNumber => {
                // Open it on Orders & tracking, filtered to this order
                setActivePage('orders');
                setSearchQuery(orderNumber);
                window.scrollTo(0, 0);
              }}
              onToast={showToast}
            />
          )}
          {activePage === 'sales' && <TeamSales data={data} onToast={showToast} />}
          {activePage === 'exec-reports' && (
            <TelecallingExecutivesView
              data={data}
              selectedId={reportExec}
              onSelect={id => { setReportExec(id); window.scrollTo(0, 0); }}
              searchQuery={searchQuery}
              onToast={showToast}
            />
          )}
          {activePage === 'onboarding' && <StaffOnboarding onToast={showToast} />}
          {activePage === 'inventory' && <TeamInventory orders={SALES_ORDERS} complaints={complaints} searchQuery={searchQuery} onToast={showToast} />}
          {activePage === 'orders' && <TeamOrders orders={SALES_ORDERS} complaints={complaints} searchQuery={searchQuery} onToast={showToast} />}
          {activePage === 'enquiries' && (
            <EnquiriesView
              enquiries={enquiries}
              onEnquiriesChange={setEnquiries}
              leads={leads}
              activities={activities}
              orders={SALES_ORDERS}
              onAssignToCaller={handleAssignEnquiries}
              onImportEnquiries={handleImportEnquiries}
              onToast={showToast}
            />
          )}
          {activePage === 'reports' && (
            <TeamReports data={data} complaints={complaints} enquiries={enquiries} headName={user.name} onToast={showToast} />
          )}
          {activePage === 'complaints' && (
            <TeamComplaints complaints={complaints} onComplaintsChange={setComplaints} headName={user.name} searchQuery={searchQuery} onToast={showToast} />
          )}
        </main>
      </div>

      <footer className="site-footer">
        <div>© 2026 Manikstu Agri Network · Odisha</div>
      </footer>
      <FooterFrieze />

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onClearAll={() => setAlertsCleared(true)}
        title="Team Alerts"
      />
    </div>
  );
}
