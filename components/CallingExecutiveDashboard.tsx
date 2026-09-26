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
import CallModal, { CallTarget, dial } from './calling-executive/CallModal';
import { TODAY, CallOutcome } from '../data/managerDashboard';
import { dayStart } from '../lib/format';
import type { CallInput, TrackerState } from '../lib/trackerOps';
import { useTracker } from '../lib/useTracker';
import SyncBadge from './SyncBadge';
import CallReportImport from './calling-executive/CallReportImport';
import { stageOf } from './telecaller/tcData';
import { QueueItem, buildQueue, callerFor } from './calling-executive/queue';
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

export default function CallingExecutiveDashboard({ user, tracker }: { user: SessionUser; tracker: TrackerState }) {
  const firstName = user.name.split(' ')[0];
  const me = callerFor(user.name);

  const [activePage, setActivePage] = useState('desk');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shared tracker data: leads the telecalling head assigns show up here automatically, and calls
  // saved here reach the head's dashboard and the manager's Team overview.
  const sync = useTracker(tracker);
  const { leads, followups, activities } = sync.data;

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

  /** Records a call (activity, lead stage, follow-ups) on the server and takes the lead out of the queue. */
  const logCall = async (
    { lead, followup }: CallTarget,
    outcome: CallOutcome,
    form: CallForm,
    durationSec: number | null,
  ) => {
    const call: CallInput = {
      leadId: lead.id,
      outcome,
      stageId: form.stageId,
      note: form.note,
      durationSec,
      followupId: followup?.id ?? null,
      next: form.scheduleNext && form.nextDate ? { date: form.nextDate, note: form.nextNote } : null,
    };
    setHandled(prev => [...prev, lead.id]);
    setSkipped(prev => prev.filter(id => id !== lead.id));
    try {
      await sync.run({ type: 'log-call', call });
      const stageChanged = form.stageId !== lead.stage_id;
      showToast(`${lead.customer_name}: ${outcome}${stageChanged ? ` · moved to ${stageOf(form.stageId)?.name}` : ''}${form.scheduleNext ? ' · callback booked' : ''}`);
    } catch (e) {
      setHandled(prev => prev.filter(id => id !== lead.id)); // not saved: keep it in the queue
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  // Call dashboard: save the call on the desk and move to the next lead.
  const handleSave = (outcome: CallOutcome) => {
    if (!current) return;
    logCall(current, outcome, form, outcome === 'Connected' && callStartedAt !== null ? elapsedSec : null);
    setSelectedLeadId(null);
    resetTimer();
  };

  // Call desk page: the Call button dials straight away and opens the calling window there.
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null);
  const startCallFromDesk = (leadId: number, followupId?: number) => {
    if (callLive) {
      showToast('Finish the call on the Call dashboard first');
      return;
    }
    const lead = myLeads.find(l => l.id === leadId);
    if (!lead) return;
    const followup =
      (followupId !== undefined ? myFollowups.find(f => f.id === followupId) : undefined) ??
      queue.find(q => q.lead.id === leadId)?.followup ??
      myFollowups.filter(f => f.lead_id === leadId && f.status !== 'done').sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
    dial(lead.phone);
    setCallTarget({ lead, followup });
  };

  const completeFollowup = async (followupId: number) => {
    try {
      const { message } = await sync.run({ type: 'complete-followup', followupId });
      showToast(message);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
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
    import:    { title: 'Import Call Report', sub: 'Upload your calling report (Excel, CSV or PDF). Each row becomes a call on your lead, and the head and manager see it straight away.' },
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
        { key: 'import', label: 'Import call report' },
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
      {toastMessage && <div className={`toast ${toastMessage.startsWith('⚠️') ? 'toast-error' : ''}`}>{toastMessage.startsWith('⚠️') ? toastMessage : `✅ ${toastMessage}`}</div>}

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
              <SyncBadge syncedAt={sync.syncedAt} offline={sync.offline} />
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
              followups={myFollowups}
              leads={myLeads}
              onCallFollowup={startCallFromDesk}
              onFollowupDone={completeFollowup}
            />
          )}
          {activePage === 'history' && <CallHistoryView activities={myActivities} leads={myLeads} searchQuery={searchQuery} />}
          {activePage === 'callbacks' && (
            <CallbacksView leads={myLeads} followups={myFollowups} activities={myActivities} queue={queue} searchQuery={searchQuery} onOpen={startCallFromDesk} />
          )}
          {activePage === 'import' && (
            <CallReportImport
              leads={myLeads}
              onImport={async calls => {
                try {
                  const { message } = await sync.run({ type: 'import-report', calls });
                  showToast(message);
                } catch (e) {
                  showToast(`⚠️ ${(e as Error).message}`);
                  throw e;
                }
              }}
              onToast={showToast}
            />
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

      {callTarget && (
        <CallModal
          key={callTarget.lead.id}
          target={callTarget}
          me={me}
          history={activities.filter(a => a.lead_id === callTarget.lead.id).sort((a, b) => b.created_at.localeCompare(a.created_at))}
          initialForm={emptyForm(callTarget.lead.stage_id, callTarget.followup?.note ?? '')}
          onSave={(outcome, callForm, durationSec) => {
            logCall(callTarget, outcome, callForm, durationSec);
            setCallTarget(null);
          }}
          onClose={() => setCallTarget(null)}
        />
      )}
    </div>
  );
}
