'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import HeaderFrieze from './HeaderFrieze';
import FooterFrieze from './FooterFrieze';
import Modal from './Modal';
import NotificationsDrawer from './NotificationsDrawer';
import LogoutButton from './LogoutButton';
import TcDashboardView from './telecaller/TcDashboardView';
import TcLeadsView from './telecaller/TcLeadsView';
import TcFollowUpsView from './telecaller/TcFollowUpsView';
import TcComplaintsView from './telecaller/TcComplaintsView';
import TcSalesView from './telecaller/TcSalesView';
import TcReportsView from './telecaller/TcReportsView';
import {
  CallLogEntry,
  CallOutcome,
  Complaint,
  FollowUp,
  TcLead,
  INITIAL_CALL_LOG,
  INITIAL_COMPLAINTS,
  INITIAL_FOLLOW_UPS,
  INITIAL_MONTH_CALLS,
  INITIAL_OUTCOME_COUNTS,
  INITIAL_TC_LEADS,
  TC_NOTIFICATIONS,
} from '../data/telecallerData';
import type { SessionUser } from '../lib/session';

interface CallTarget {
  name: string;
  leadId?: string;
  followUpId?: string;
}

export default function TelecallerDashboard({ user }: { user: SessionUser }) {
  const firstName = user.name.split(' ')[0];

  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [leads, setLeads] = useState<TcLead[]>(INITIAL_TC_LEADS);
  const [callLog, setCallLog] = useState<CallLogEntry[]>(INITIAL_CALL_LOG);
  const [followUps, setFollowUps] = useState<FollowUp[]>(INITIAL_FOLLOW_UPS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [outcomeCounts, setOutcomeCounts] = useState(INITIAL_OUTCOME_COUNTS);
  const [monthCalls, setMonthCalls] = useState(INITIAL_MONTH_CALLS);
  const [notifications, setNotifications] = useState(TC_NOTIFICATIONS);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  // Call logging modal
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Connected');
  const [callDuration, setCallDuration] = useState('');
  const [callNotes, setCallNotes] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pageMeta: Record<string, { title: string; sub: string }> = {
    dashboard:  { title: 'Dashboard',     sub: `Here's your day so far, ${firstName}.` },
    today:      { title: "Today's leads", sub: 'Everyone assigned to you today, called or not.' },
    followups:  { title: 'Follow-ups',    sub: 'Promised callbacks — due, overdue and upcoming.' },
    complaints: { title: 'Complaints',    sub: 'Customer issues routed to you for resolution.' },
    sales:      { title: 'Sales',         sub: 'What your calls have converted into, month to date.' },
    reports:    { title: 'Reports',       sub: 'Your performance, exportable for review.' },
  };
  const currentMeta = pageMeta[activePage] || pageMeta.dashboard;

  const pendingLeads = leads.filter(l => l.status === 'Pending').length;
  const dueFollowUps = followUps.filter(f => f.status === 'Due today' || f.status === 'Overdue').length;
  const openComplaints = complaints.filter(c => c.status !== 'Resolved').length;

  const navGroups = [
    { label: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard' }] },
    {
      label: 'Calls',
      items: [
        { key: 'today', label: "Today's leads", count: pendingLeads },
        { key: 'followups', label: 'Follow-ups', count: dueFollowUps },
      ],
    },
    { label: 'Support', items: [{ key: 'complaints', label: 'Complaints', count: openComplaints }] },
    {
      label: 'Performance',
      items: [
        { key: 'sales', label: 'Sales' },
        { key: 'reports', label: 'Reports' },
      ],
    },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const openCallModal = (target: CallTarget) => {
    setCallTarget(target);
    setCallOutcome('Connected');
    setCallDuration('');
    setCallNotes('');
  };

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTarget) return;

    const time = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    const entry: CallLogEntry = {
      id: `C-${Date.now()}`,
      lead: callTarget.name,
      time,
      outcome: callOutcome,
      duration: callOutcome === 'Connected' && callDuration.trim() ? callDuration.trim() : '—',
      notes: callNotes.trim() || '—',
    };
    setCallLog(prev => [entry, ...prev]);
    setOutcomeCounts(prev => ({ ...prev, [callOutcome]: prev[callOutcome] + 1 }));
    setMonthCalls(prev => prev + 1);

    if (callTarget.leadId) {
      setLeads(prev => prev.map(l => (l.id === callTarget.leadId ? { ...l, status: callOutcome } : l)));
    }
    if (callTarget.followUpId && callOutcome === 'Connected') {
      setFollowUps(prev => prev.map(f => (f.id === callTarget.followUpId ? { ...f, status: 'Completed', lastContacted: 'Today' } : f)));
    }

    setCallTarget(null);
    showToast(`Call with ${callTarget.name} logged as ${callOutcome}`);
  };

  const handleAdvanceComplaint = (id: string, next: Complaint['status']) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status: next } : c)));
    showToast(`${id} marked ${next.toLowerCase()}`);
  };

  return (
    <div>
      {toastMessage && <div className="toast">✅ {toastMessage}</div>}

      <div className="masthead">
        <div className="masthead-bar">
          <div className="brand">
            <div className="brand-mark">🌾</div>
            <div>
              <div className="brand-name">Maniksthu Telecalling</div>
              <div className="brand-tag">Staff Portal</div>
            </div>
          </div>
          <div className="masthead-right">
            <span>Morning shift · 9:00–18:00</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Staff ID: {user.staffId}</span>
          </div>
        </div>
      </div>

      <HeaderFrieze />

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
                  placeholder="Search leads, customers…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activePage === 'dashboard' || activePage === 'sales' || activePage === 'reports') {
                      setActivePage('today');
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
              <button className="icon-btn" title="Notifications" onClick={() => setIsNotifsOpen(o => !o)}>
                <Bell size={18} />
                {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
              </button>
              <div className="who" style={{ cursor: 'default' }}>
                <div className="avatar">{user.initials}</div>
                <div>
                  <div className="who-name">{user.name}</div>
                  <div className="who-role">Telecalling Staff</div>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>

          {activePage === 'dashboard' && (
            <TcDashboardView
              leads={leads}
              followUps={followUps}
              complaints={complaints}
              callLog={callLog}
              outcomeCounts={outcomeCounts}
              monthCalls={monthCalls}
              onCall={openCallModal}
              onNavigate={handleNavigate}
            />
          )}
          {activePage === 'today' && <TcLeadsView leads={leads} searchQuery={searchQuery} onCall={openCallModal} />}
          {activePage === 'followups' && (
            <TcFollowUpsView followUps={followUps} searchQuery={searchQuery} onCall={openCallModal} />
          )}
          {activePage === 'complaints' && (
            <TcComplaintsView complaints={complaints} searchQuery={searchQuery} onAdvance={handleAdvanceComplaint} />
          )}
          {activePage === 'sales' && <TcSalesView />}
          {activePage === 'reports' && <TcReportsView onGenerate={(name) => showToast(`Generated ${name} report`)} />}
        </main>
      </div>

      <footer className="site-footer">
        <div>© 2026 Maniksthu Agri Network · Odisha</div>
        <div className="links">
          <span onClick={() => showToast('Telecalling support: +91 674 290182')}>Support</span>
          <span onClick={() => showToast('Call script handbook opened')}>Documentation</span>
          <span onClick={() => showToast('Privacy compliance active')}>Privacy</span>
        </div>
      </footer>
      <FooterFrieze />

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        title="My Alerts"
      />

      <Modal isOpen={callTarget !== null} onClose={() => setCallTarget(null)} title={`Log call · ${callTarget?.name ?? ''}`}>
        <form onSubmit={handleLogCall}>
          <div className="form-group">
            <label>Outcome</label>
            <select value={callOutcome} onChange={(e) => setCallOutcome(e.target.value as CallOutcome)}>
              <option value="Connected">Connected</option>
              <option value="No answer">No answer</option>
              <option value="Busy">Busy / switched off</option>
            </select>
          </div>
          {callOutcome === 'Connected' && (
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                placeholder="e.g. 3m 20s"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
              />
            </div>
          )}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={3}
              placeholder="What was discussed, next step…"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setCallTarget(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Save call</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
