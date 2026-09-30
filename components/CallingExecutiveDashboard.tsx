'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, History, LayoutDashboard, ListChecks } from 'lucide-react';
import Sidebar, { NavGroup } from './Sidebar';
import Topbar from './Topbar';
import FooterFrieze from './FooterFrieze';
import CeOverview from './calling-executive/CeOverview';
import type { CallForm } from './calling-executive/CallDeskView';
import CallHistoryView from './calling-executive/CallHistoryView';
import CallbacksView from './calling-executive/CallbacksView';
import CeFollowupsView from './calling-executive/CeFollowupsView';
import CeReportsView from './calling-executive/CeReportsView';
import CallModal, { CallTarget, dial } from './calling-executive/CallModal';
import { TODAY, TRACKER_SALES, CallOutcome } from '../data/managerDashboard';
import { dayStart } from '../lib/format';
import type { CallInput, TrackerState } from '../lib/trackerOps';
import { useTracker } from '../lib/useTracker';
import SyncBadge from './SyncBadge';
import { TeamData, stageOf } from './telecaller/tcData';
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

  const [activePage, setActivePage] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shared tracker data: leads the telecalling head assigns show up here automatically, and calls
  // saved here reach the head's dashboard and the manager's Team overview.
  const sync = useTracker(tracker);
  const { leads, followups, activities } = sync.data;
  const teamData: TeamData = useMemo(
    () => ({ leads, followups, activities, sales: TRACKER_SALES }),
    [leads, followups, activities],
  );

  const myLeads = useMemo(() => leads.filter(l => l.assigned_to === me.id), [leads, me.id]);
  const myFollowups = useMemo(() => followups.filter(f => f.caller_id === me.id), [followups, me.id]);
  const myActivities = useMemo(() => activities.filter(a => a.caller_id === me.id), [activities, me.id]);

  // Leads called this session drop out of the "to call now" queue count.
  const [handled, setHandled] = useState<number[]>([]);
  const queue = useMemo(() => {
    return buildQueue(myLeads, myFollowups, myActivities).filter(q => !handled.includes(q.lead.id));
  }, [myLeads, myFollowups, myActivities, handled]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /** Records a call (activity, lead stage, follow-ups) on the server. */
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
    try {
      await sync.run({ type: 'log-call', call });
      const stageChanged = form.stageId !== lead.stage_id;
      showToast(`${lead.customer_name}: ${outcome}${stageChanged ? ` · moved to ${stageOf(form.stageId)?.name}` : ''}${form.scheduleNext ? ' · callback booked' : ''}`);
    } catch (e) {
      setHandled(prev => prev.filter(id => id !== lead.id)); // not saved: keep it in the queue
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  // The Call button dials straight away and opens the calling window.
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null);
  const startCall = (leadId: number, followupId?: number) => {
    const lead = myLeads.find(l => l.id === leadId);
    if (!lead) return;
    const followup =
      (followupId !== undefined ? myFollowups.find(f => f.id === followupId) : undefined) ??
      queue.find(q => q.lead.id === leadId)?.followup ??
      myFollowups.filter(f => f.lead_id === leadId && f.status !== 'done').sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
    dial(lead.phone);
    setCallTarget({ lead, followup });
  };

  /** "Start calling": open the next lead in the queue. */
  const startNext = () => {
    if (queue[0]) startCall(queue[0].lead.id);
    else showToast('No leads waiting to be called right now');
  };

  const completeFollowup = async (followupId: number) => {
    try {
      const { message } = await sync.run({ type: 'complete-followup', followupId });
      showToast(message);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  const dueCallbacks = myFollowups.filter(
    f => f.status !== 'done' && (f.status === 'missed' || dayStart(f.due_at) <= dayStart(TODAY))
  ).length;

  const pageMeta: Record<string, { title: string; sub: string }> = {
    overview:  { title: `Namaskar, ${firstName}`, sub: 'Your day, callbacks, leads and performance at a glance.' },
    history:   { title: 'Call History', sub: 'Every call you have logged, with outcome, duration and note.' },
    callbacks: { title: 'Call Desk',    sub: 'Your assigned leads, calls made, pending calls and callbacks in one place.' },
    followups: { title: 'Follow-ups',   sub: 'Every callback you owe — overdue, due today and upcoming.' },
    reports:   { title: 'Reports',      sub: 'Your calling performance, and reports you can download as Excel or PDF.' },
  };
  const currentMeta = pageMeta[activePage] ?? pageMeta.overview;

  const navGroups: NavGroup[] = [
    { label: 'Overview', items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }] },
    {
      label: 'My work',
      items: [
        { key: 'callbacks', label: 'Call desk', icon: CalendarClock, count: dueCallbacks },
        { key: 'followups', label: 'Follow-ups', icon: ListChecks, count: dueCallbacks },
        { key: 'history', label: 'Call history', icon: History },
      ],
    },
    { label: 'Performance', items: [{ key: 'reports', label: 'Reports', icon: BarChart3 }] },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  return (
    <div className="card-layout">
      {toastMessage && <div className={`toast ${toastMessage.startsWith('⚠️') ? 'toast-error' : ''}`}>{toastMessage.startsWith('⚠️') ? toastMessage : `✅ ${toastMessage}`}</div>}

      <div className="shell">
        <Sidebar groups={navGroups} activePage={activePage} onSelectPage={handleNavigate} />

        <main className="main">
          <Topbar
            title={currentMeta.title}
            subtitle={currentMeta.sub}
            search={activePage === 'history' || activePage === 'callbacks' || activePage === 'followups'
              ? { query: searchQuery, onChange: setSearchQuery, placeholder: 'Search by name, phone or note…' }
              : undefined}
            status={<SyncBadge syncedAt={sync.syncedAt} offline={sync.offline} />}
            profile={{ name: user.name, role: 'Calling Executive', initials: user.initials, detail: `Staff ID ${user.staffId} · Morning shift 9:00–18:00` }}
          />

          {activePage === 'overview' && (
            <CeOverview
              data={teamData}
              me={me}
              queueCount={queue.length}
              onStartCalling={startNext}
              onOpenCallbacks={() => handleNavigate('callbacks')}
              onCallLead={startCall}
              onFollowupDone={completeFollowup}
            />
          )}
          {activePage === 'followups' && (
            <CeFollowupsView
              leads={myLeads}
              followups={myFollowups}
              activities={myActivities}
              searchQuery={searchQuery}
              onCall={startCall}
              onDone={completeFollowup}
            />
          )}
          {activePage === 'history' && <CallHistoryView activities={myActivities} leads={myLeads} searchQuery={searchQuery} />}
          {activePage === 'callbacks' && (
            <CallbacksView leads={myLeads} followups={myFollowups} activities={myActivities} queue={queue} assignments={sync.data.assignments} searchQuery={searchQuery} onOpen={startCall} />
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
          <footer className="site-footer">
            <div>© 2026 Manikstu Agri Network · Calling desk</div>
          </footer>
          <FooterFrieze />
        </main>
      </div>

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
