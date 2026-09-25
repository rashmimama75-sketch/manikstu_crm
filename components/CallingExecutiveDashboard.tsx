'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Search, Sun } from 'lucide-react';
import HeaderFrieze from './HeaderFrieze';
import FooterFrieze from './FooterFrieze';
import LogoutButton from './LogoutButton';
import CallDeskView, { CallForm } from './calling-executive/CallDeskView';
import CallHistoryView from './calling-executive/CallHistoryView';
import CallbacksView from './calling-executive/CallbacksView';
import CeReportsView from './calling-executive/CeReportsView';
import {
  FOLLOWUPS,
  LEAD_ACTIVITIES,
  TODAY,
  TRACKER_LEADS,
  CallOutcome,
  Followup,
  LeadActivity,
  TrackerLead,
} from '../data/managerDashboard';
import { dayStart, nowStamp } from '../lib/format';
import { QueueItem, buildQueue, stageOf, telecallerFor } from './telecaller/tcData';
import type { SessionUser } from '../lib/session';

const tomorrow = () => {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = (stageId: number, nextNote = ''): CallForm => ({
  note: '',
  stageId,
  scheduleNext: false,
  nextDate: tomorrow(),
  nextNote,
});

export default function CallingExecutiveDashboard({ user }: { user: SessionUser }) {
  const firstName = user.name.split(' ')[0];
  const me = telecallerFor(user.name);

  const [activePage, setActivePage] = useState('desk');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Same tracker data the manager and telecallers use; this executive works their own slice.
  const [leads, setLeads] = useState<TrackerLead[]>(TRACKER_LEADS);
  const [followups, setFollowups] = useState<Followup[]>(FOLLOWUPS);
  const [activities, setActivities] = useState<LeadActivity[]>(LEAD_ACTIVITIES);

  const myLeads = useMemo(() => leads.filter(l => l.assigned_to === me.id), [leads, me.id]);
  const myFollowups = useMemo(() => followups.filter(f => f.caller_id === me.id), [followups, me.id]);
  const myActivities = useMemo(() => activities.filter(a => a.caller_id === me.id), [activities, me.id]);
  const todayCalls = useMemo(() => myActivities.filter(a => a.created_at.startsWith(TODAY)), [myActivities]);

  // Leads handled or skipped in this session drop out of (or to the back of) the queue.
  const [handled, setHandled] = useState<number[]>([]);
  const [skipped, setSkipped] = useState<number[]>([]);
  const queue = useMemo(() => {
    const all = buildQueue(myLeads, myFollowups, myActivities).filter(q => !handled.includes(q.lead.id));
    const fresh = all.filter(q => !skipped.includes(q.lead.id));
    const later = skipped.map(id => all.find(q => q.lead.id === id)).filter((q): q is QueueItem => !!q);
    return [...fresh, ...later];
  }, [myLeads, myFollowups, myActivities, handled, skipped]);

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const current = queue.find(q => q.lead.id === selectedLeadId) ?? queue[0];

  const [form, setForm] = useState<CallForm>(() => emptyForm(current?.lead.stage_id ?? 0, current?.followup?.note ?? ''));
  const [formLeadId, setFormLeadId] = useState<number | null>(current?.lead.id ?? null);
  if ((current?.lead.id ?? null) !== formLeadId) {
    // A different lead is on the desk: reset the form for it.
    setFormLeadId(current?.lead.id ?? null);
    setForm(emptyForm(current?.lead.stage_id ?? 0, current?.followup?.note ?? ''));
  }

  // Live call timer
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callEndedAt, setCallEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const callLive = callStartedAt !== null && callEndedAt === null;
  useEffect(() => {
    if (!callLive) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [callLive]);
  const elapsedSec = callStartedAt === null ? 0 : Math.max(0, Math.floor(((callEndedAt ?? now) - callStartedAt) / 1000));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const startCall = () => {
    setNow(Date.now());
    setCallStartedAt(Date.now());
    setCallEndedAt(null);
  };

  const resetTimer = () => {
    setCallStartedAt(null);
    setCallEndedAt(null);
  };

  const handleSave = (outcome: CallOutcome) => {
    if (!current) return;
    const { lead, followup } = current;
    const stamp = nowStamp();
    const durationSec = outcome === 'Connected' && callStartedAt !== null ? elapsedSec : null;

    setActivities(prev => [...prev, {
      id: Math.max(0, ...prev.map(a => a.id)) + 1,
      lead_id: lead.id,
      caller_id: me.id,
      stage_id: form.stageId,
      note: form.note.trim() || (outcome === 'Connected' ? 'Spoke to customer' : outcome),
      outcome,
      duration_sec: durationSec,
      created_at: stamp,
    }]);
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, stage_id: form.stageId, updated_at: stamp } : l)));

    setFollowups(prev => {
      let next = prev;
      if (followup && outcome === 'Connected') {
        next = next.map(f => (f.id === followup.id ? { ...f, status: 'done', completed_at: stamp } : f));
      }
      if (form.scheduleNext && form.nextDate) {
        next = [...next, {
          id: Math.max(0, ...next.map(f => f.id)) + 1,
          lead_id: lead.id,
          caller_id: me.id,
          due_at: `${form.nextDate}T10:00`,
          note: form.nextNote.trim() || 'Call back',
          status: 'pending',
          completed_at: null,
        }];
      }
      return next;
    });

    setHandled(prev => [...prev, lead.id]);
    setSkipped(prev => prev.filter(id => id !== lead.id));
    setSelectedLeadId(null);
    resetTimer();

    const stageChanged = form.stageId !== lead.stage_id;
    showToast(`${lead.customer_name}: ${outcome}${stageChanged ? ` · moved to ${stageOf(form.stageId)?.name}` : ''}${form.scheduleNext ? ' · callback booked' : ''}`);
  };

  const handleSkip = () => {
    if (!current) return;
    setSkipped(prev => [...prev.filter(id => id !== current.lead.id), current.lead.id]);
    setSelectedLeadId(null);
    resetTimer();
  };

  const selectLead = (leadId: number) => {
    setSelectedLeadId(leadId);
    resetTimer();
  };

  const openOnDesk = (leadId: number) => {
    if (callLive) {
      showToast('Finish the current call first');
      return;
    }
    // Pull a lead back into the queue if it was already handled this session.
    setHandled(prev => prev.filter(id => id !== leadId));
    selectLead(leadId);
    setActivePage('desk');
    window.scrollTo(0, 0);
  };

  const leadHistory = useMemo(() => {
    if (!current) return [];
    return activities.filter(a => a.lead_id === current.lead.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [activities, current]);

  const dueCallbacks = myFollowups.filter(
    f => f.status !== 'done' && (f.status === 'missed' || dayStart(f.due_at) <= dayStart(TODAY))
  ).length;

  const pageMeta: Record<string, { title: string; sub: string }> = {
    desk:      { title: 'Call Dashboard', sub: `Work down the queue, ${firstName}. Pick an outcome to save the call and open the next one.` },
    history:   { title: 'Call History', sub: 'Every call you have logged, with outcome, duration and note.' },
    callbacks: { title: 'Call Desk',    sub: 'Your assigned leads, calls made, pending calls and callbacks in one place.' },
    reports:   { title: 'Reports',      sub: 'Your calling performance, and reports you can download as Excel or PDF.' },
  };
  const currentMeta = pageMeta[activePage] ?? pageMeta.desk;

  const navGroups = [
    { label: 'Calling', items: [{ key: 'desk', label: 'Call dashboard', count: queue.length }] },
    {
      label: 'My work',
      items: [
        { key: 'callbacks', label: 'Call desk', count: dueCallbacks },
        { key: 'history', label: 'Call history' },
      ],
    },
    { label: 'Performance', items: [{ key: 'reports', label: 'Reports' }] },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
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
                <div className="brand-name">Manikstu Calling</div>
                <div className="brand-tag">Calling Executive Desk</div>
              </div>
            </div>
            <div className="masthead-right">
              <span>Morning shift · 9:00–18:00</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Staff ID: {user.staffId}</span>

              <div className="masthead-user">
                <div className="who" style={{ cursor: 'default' }}>
                  <div className="avatar">{user.initials}</div>
                  <div>
                    <div className="who-name">{user.name}</div>
                    <div className="who-role">Calling Executive</div>
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
              {(activePage === 'history' || activePage === 'callbacks') && (
                <div className="search">
                  <Search size={16} style={{ color: 'var(--ink-soft)' }} />
                  <input
                    type="text"
                    placeholder="Search by name, phone or note…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              <button
                className="icon-btn"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>

          {activePage === 'desk' && (
            <CallDeskView
              me={me}
              queue={queue}
              current={current}
              todayCalls={todayCalls}
              leadHistory={leadHistory}
              handledCount={handled.length}
              callLive={callLive}
              callTimed={callStartedAt !== null}
              elapsedSec={elapsedSec}
              form={form}
              onFormChange={patch => setForm(f => ({ ...f, ...patch }))}
              onSelect={selectLead}
              onStartCall={startCall}
              onEndCall={() => setCallEndedAt(Date.now())}
              onSave={handleSave}
              onSkip={handleSkip}
            />
          )}
          {activePage === 'history' && <CallHistoryView activities={myActivities} leads={myLeads} searchQuery={searchQuery} />}
          {activePage === 'callbacks' && (
            <CallbacksView leads={myLeads} followups={myFollowups} activities={myActivities} queue={queue} searchQuery={searchQuery} onOpen={openOnDesk} />
          )}
          {activePage === 'reports' && (
            <CeReportsView
              me={me}
              leads={myLeads}
              followups={myFollowups}
              activities={myActivities}
              queue={queue}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      <footer className="site-footer">
        <div>© 2026 Manikstu Agri Network · Odisha</div>
      </footer>
      <FooterFrieze />
    </div>
  );
}
