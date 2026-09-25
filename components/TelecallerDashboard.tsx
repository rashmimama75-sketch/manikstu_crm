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
import TcComplaintsView from './telecaller/TcComplaintsView';
import { Complaint, INITIAL_COMPLAINTS } from '../data/telecallerData';
import {
  FOLLOWUPS,
  LEAD_ACTIVITIES,
  SALES_ORDERS,
  TRACKER_LEADS,
  TRACKER_SALES,
  WEB_ENQUIRIES,
  STAGES,
  Followup,
  TrackerLead,
} from '../data/managerDashboard';
import { nowStamp } from '../lib/format';
import type { NewLead } from './telecaller/ImportLeads';
import { TeamData, callerName, isOverdue, staffStats, teamAlerts } from './telecaller/tcData';
import type { SessionUser } from '../lib/session';

/**
 * Head telecalling dashboard: the telecalling head's view of the whole telecalling team.
 * Works on the same tracker data the manager sees (all telecallers' leads, calls, follow-ups, sales).
 */
export default function TelecallerDashboard({ user }: { user: SessionUser }) {
  const firstName = user.name.split(' ')[0];

  const [activePage, setActivePage] = useState('overview');
  const [focusCaller, setFocusCaller] = useState<number | undefined>(undefined);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reassigning changes leads and follow-ups; calls and sales are read-only here.
  const [leads, setLeads] = useState<TrackerLead[]>(TRACKER_LEADS);
  const [followups, setFollowups] = useState<Followup[]>(FOLLOWUPS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const data: TeamData = useMemo(
    () => ({ leads, followups, activities: LEAD_ACTIVITIES, sales: TRACKER_SALES }),
    [leads, followups],
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
    sales:      { title: 'Team Sales',           sub: 'What the team has sold, by telecaller, product and month.' },
    onboarding: { title: 'Staff Onboarding',     sub: 'Add telecalling staff and create their Staff ID and temporary password.' },
    complaints: { title: 'Complaints',           sub: 'Customer issues routed to the telecalling team.' },
  };
  const currentMeta = pageMeta[activePage] || pageMeta.overview;

  const overdueCount = followups.filter(isOverdue).length;
  const withInactive = todayStats.filter(s => !s.t.is_active).reduce((a, s) => a + s.openLeads, 0);
  const openComplaints = complaints.filter(c => c.status !== 'Resolved').length;

  const navGroups = [
    { label: 'Overview', items: [{ key: 'overview', label: 'Team overview', count: alerts.filter(a => a.level === 'critical').length }] },
    {
      label: 'Team',
      items: [
        { key: 'leads', label: 'Leads & assignment', count: withInactive },
        { key: 'followups', label: 'Follow-ups', count: overdueCount },
        { key: 'onboarding', label: 'Staff onboarding' },
      ],
    },
    { label: 'Performance', items: [{ key: 'sales', label: 'Sales' }] },
    { label: 'Support', items: [{ key: 'complaints', label: 'Complaints', count: openComplaints }] },
  ];

  const handleNavigate = (page: string, callerId?: number) => {
    setActivePage(page);
    setFocusCaller(callerId);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  /** Move leads (and their pending follow-ups) to another telecaller. */
  const handleReassign = (leadIds: number[], toCallerId: number) => {
    const ids = new Set(leadIds);
    setLeads(prev => prev.map(l => (ids.has(l.id) ? { ...l, assigned_to: toCallerId } : l)));
    setFollowups(prev => prev.map(f => (ids.has(f.lead_id) && f.status !== 'done' ? { ...f, caller_id: toCallerId, status: 'pending' } : f)));
    showToast(`${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} moved to ${callerName(toCallerId)}`);
  };

  /** Create leads from an imported Excel / PDF file, in the first stage of their product line. */
  const handleImport = (newLeads: NewLead[]) => {
    const now = nowStamp();
    setLeads(prev => {
      let nextId = Math.max(0, ...prev.map(l => l.id)) + 1;
      const created: TrackerLead[] = newLeads.map(l => ({
        ...l,
        id: nextId++,
        stage_id: STAGES.filter(s => s.vertical_id === l.vertical_id).sort((a, b) => a.sort_order - b.sort_order)[0].id,
        created_at: now,
        updated_at: now,
      }));
      return [...created, ...prev];
    });
    const people = new Set(newLeads.map(l => l.assigned_to)).size;
    showToast(`${newLeads.length} lead${newLeads.length === 1 ? '' : 's'} imported and assigned to ${people} telecaller${people === 1 ? '' : 's'}`);
  };

  const handleAdvanceComplaint =(id: string, next: Complaint['status']) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status: next } : c)));
    showToast(`${id} marked ${next.toLowerCase()}`);
  };

  return (
    <div>
      {toastMessage && <div className="toast">✅ {toastMessage}</div>}

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
                    <span className="count">{item.count}</span>
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
              <div className="search">
                <Search size={16} style={{ color: 'var(--ink-soft)' }} />
                <input
                  type="text"
                  placeholder="Search leads by name or phone…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activePage !== 'leads' && activePage !== 'followups' && activePage !== 'complaints') {
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
              enquiries={WEB_ENQUIRIES}
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
          {activePage === 'sales' && <TeamSales data={data} onToast={showToast} />}
          {activePage === 'onboarding' && <StaffOnboarding onToast={showToast} />}
          {activePage === 'complaints' && (
            <TcComplaintsView complaints={complaints} searchQuery={searchQuery} onAdvance={handleAdvanceComplaint} />
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
