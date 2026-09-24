'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Complaint, INITIAL_COMPLAINTS } from '../data/telecallerData';
import {
  FOLLOWUPS,
  LEAD_ACTIVITIES,
  TRACKER_LEADS,
  TRACKER_PRODUCTS,
  TRACKER_SALES,
  CallOutcome,
  Followup,
  LeadActivity,
  TrackerLead,
  TrackerSale,
  isWonStage,
} from '../data/managerDashboard';
import { nowStamp, rupees } from '../lib/format';
import {
  OUTCOMES,
  buildQueue,
  isOpenLead,
  stageOf,
  stagesFor,
  telecallerFor,
  verticalName,
  wonStageFor,
} from './telecaller/tcData';
import type { SessionUser } from '../lib/session';

/** What a call is being logged against. */
interface CallTarget {
  lead: TrackerLead;
  followup?: Followup;
}

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function TelecallerDashboard({ user }: { user: SessionUser }) {
  const firstName = user.name.split(' ')[0];
  const me = telecallerFor(user.name);

  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Same data the manager sees; this telecaller works on their own slice of it.
  const [leads, setLeads] = useState<TrackerLead[]>(TRACKER_LEADS);
  const [followups, setFollowups] = useState<Followup[]>(FOLLOWUPS);
  const [activities, setActivities] = useState<LeadActivity[]>(LEAD_ACTIVITIES);
  const [sales, setSales] = useState<TrackerSale[]>(TRACKER_SALES);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);

  const myLeads = useMemo(() => leads.filter(l => l.assigned_to === me.id), [leads, me.id]);
  const myFollowups = useMemo(() => followups.filter(f => f.caller_id === me.id), [followups, me.id]);
  const myActivities = useMemo(() => activities.filter(a => a.caller_id === me.id), [activities, me.id]);
  const mySales = useMemo(() => sales.filter(s => s.caller_id === me.id), [sales, me.id]);
  const queue = useMemo(() => buildQueue(myLeads, myFollowups, myActivities), [myLeads, myFollowups, myActivities]);

  // Alerts built from the data, clearable for the session
  const [alertsCleared, setAlertsCleared] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const notifications = useMemo(() => {
    if (alertsCleared) return [];
    const overdue = queue.filter(q => q.reason === 'Overdue follow-up');
    const dueToday = queue.filter(q => q.reason === 'Follow-up today');
    const webLeads = myLeads.filter(l => l.source === 'Website' && isOpenLead(l));
    const list = [];
    if (overdue.length) list.push({ id: 'n-overdue', title: `${overdue.length} follow-up${overdue.length > 1 ? 's' : ''} overdue`, message: `${overdue[0].lead.customer_name} was due earlier. Call them first.`, time: 'Now', type: 'warning' as const });
    if (dueToday.length) list.push({ id: 'n-today', title: `${dueToday.length} follow-up${dueToday.length > 1 ? 's' : ''} due today`, message: dueToday.map(q => q.lead.customer_name).slice(0, 3).join(', '), time: 'Today', type: 'info' as const });
    if (webLeads.length) list.push({ id: 'n-web', title: `${webLeads.length} lead${webLeads.length > 1 ? 's' : ''} from website enquiries`, message: 'These customers contacted Manikstu themselves.', time: 'Today', type: 'success' as const });
    return list;
  }, [alertsCleared, queue, myLeads]);

  // Log call modal
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Connected');
  const [callMinutes, setCallMinutes] = useState('');
  const [callNote, setCallNote] = useState('');
  const [callStage, setCallStage] = useState<number>(0);
  const [closeFollowup, setCloseFollowup] = useState(true);
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState(tomorrow());
  const [nextNote, setNextNote] = useState('');

  // Record sale modal
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleLeadId, setSaleLeadId] = useState<number | null>(null);
  const [saleProductId, setSaleProductId] = useState<number>(0);
  const [saleQty, setSaleQty] = useState('1');
  const [saleMarkWon, setSaleMarkWon] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pageMeta: Record<string, { title: string; sub: string }> = {
    dashboard:  { title: 'My Day',      sub: `Here's your day so far, ${firstName}. Start at the top of “Call next”.` },
    leads:      { title: 'My Leads',    sub: 'Everyone assigned to you, by product and stage.' },
    followups:  { title: 'Follow-ups',  sub: 'Promised callbacks: overdue, due today and upcoming.' },
    complaints: { title: 'Complaints',  sub: 'Customer issues routed to you for resolution.' },
    sales:      { title: 'My Sales',    sub: 'What your calls have turned into this month.' },
    reports:    { title: 'Reports',     sub: 'Your calls, sales and follow-ups, exportable to Excel or PDF.' },
  };
  const currentMeta = pageMeta[activePage] || pageMeta.dashboard;

  const dueFollowUps = queue.filter(q => q.reason === 'Overdue follow-up' || q.reason === 'Follow-up today').length;
  const newLeads = queue.filter(q => q.reason === 'New lead').length;
  const openComplaints = complaints.filter(c => c.status !== 'Resolved').length;

  const navGroups = [
    { label: 'Overview', items: [{ key: 'dashboard', label: 'My day' }] },
    {
      label: 'Calls',
      items: [
        { key: 'leads', label: 'My leads', count: newLeads },
        { key: 'followups', label: 'Follow-ups', count: dueFollowUps },
      ],
    },
    { label: 'Support', items: [{ key: 'complaints', label: 'Complaints', count: openComplaints }] },
    {
      label: 'Performance',
      items: [
        { key: 'sales', label: 'My sales' },
        { key: 'reports', label: 'Reports' },
      ],
    },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  // ---- Log call ----------------------------------------------------------------------------
  const openCall = (lead: TrackerLead, followup?: Followup) => {
    setCallTarget({ lead, followup });
    setCallOutcome('Connected');
    setCallMinutes('');
    setCallNote('');
    setCallStage(lead.stage_id);
    setCloseFollowup(true);
    setScheduleNext(false);
    setNextDate(tomorrow());
    setNextNote(followup?.note ?? '');
  };

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTarget) return;
    const { lead, followup } = callTarget;
    const now = nowStamp();
    const minutes = Number(callMinutes);

    setActivities(prev => [...prev, {
      id: Math.max(0, ...prev.map(a => a.id)) + 1,
      lead_id: lead.id,
      caller_id: me.id,
      stage_id: callStage,
      note: callNote.trim() || (callOutcome === 'Connected' ? 'Spoke to customer' : callOutcome),
      outcome: callOutcome,
      duration_sec: callOutcome === 'Connected' && minutes > 0 ? Math.round(minutes * 60) : null,
      created_at: now,
    }]);
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, stage_id: callStage, updated_at: now } : l)));

    setFollowups(prev => {
      let next = prev;
      if (followup && closeFollowup && callOutcome === 'Connected') {
        next = next.map(f => (f.id === followup.id ? { ...f, status: 'done', completed_at: now } : f));
      }
      if (scheduleNext && nextDate) {
        next = [...next, {
          id: Math.max(0, ...next.map(f => f.id)) + 1,
          lead_id: lead.id,
          caller_id: me.id,
          due_at: `${nextDate}T10:00`,
          note: nextNote.trim() || 'Call back',
          status: 'pending',
          completed_at: null,
        }];
      }
      return next;
    });

    setCallTarget(null);
    const stageChanged = callStage !== lead.stage_id;
    showToast(`Call with ${lead.customer_name} logged as ${callOutcome}${stageChanged ? ` · moved to ${stageOf(callStage)?.name}` : ''}`);

    // Reaching a won stage usually means a sale: offer to record it straight away.
    if (stageChanged && isWonStage(stageOf(callStage))) openSale({ ...lead, stage_id: callStage }, false);
  };

  // ---- Record sale -------------------------------------------------------------------------
  const productsFor = (lead: TrackerLead | undefined) =>
    lead ? TRACKER_PRODUCTS.filter(p => p.vertical_id === lead.vertical_id) : [];

  const openSale = (lead?: TrackerLead, markWon = true) => {
    const target = lead ?? myLeads.find(isOpenLead);
    setSaleLeadId(target?.id ?? null);
    setSaleProductId(productsFor(target)[0]?.id ?? 0);
    setSaleQty('1');
    setSaleMarkWon(markWon && !!target && !isWonStage(stageOf(target.stage_id)));
    setSaleOpen(true);
  };

  const saleLead = myLeads.find(l => l.id === saleLeadId);
  const saleProduct = TRACKER_PRODUCTS.find(p => p.id === saleProductId);
  const saleAmount = (saleProduct?.price ?? 0) * Math.max(1, Number(saleQty) || 1);

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleLead || !saleProduct) return;
    const quantity = Math.max(1, Number(saleQty) || 1);
    setSales(prev => [...prev, {
      id: Math.max(0, ...prev.map(s => s.id)) + 1,
      lead_id: saleLead.id,
      product_id: saleProduct.id,
      caller_id: me.id,
      customer_name: saleLead.customer_name,
      quantity,
      amount: saleProduct.price * quantity,
      sold_at: nowStamp().slice(0, 10),
    }]);
    const won = wonStageFor(saleLead.vertical_id);
    if (saleMarkWon && won) {
      setLeads(prev => prev.map(l => (l.id === saleLead.id ? { ...l, stage_id: won.id, updated_at: nowStamp() } : l)));
    }
    setSaleOpen(false);
    showToast(`Sale recorded: ${saleProduct.name} × ${quantity} for ${saleLead.customer_name} · ${rupees(saleProduct.price * quantity)}`);
  };

  const handleCompleteFollowup = (id: number) => {
    setFollowups(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', completed_at: nowStamp() } : f)));
    showToast('Follow-up marked done');
  };

  const handleAdvanceComplaint = (id: string, next: Complaint['status']) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status: next } : c)));
    showToast(`${id} marked ${next.toLowerCase()}`);
  };

  const shared = { me, leads: myLeads, followups: myFollowups, activities: myActivities, sales: mySales, onCall: openCall, onSale: openSale };

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
              <div className="brand-tag">Staff Portal</div>
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
                  <div className="who-role">Telecalling Staff</div>
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
              <button className="btn-primary" onClick={() => openSale()} style={{ padding: '8px 14px', fontSize: 13 }}>
                + Record sale
              </button>
            </div>
          </div>

          {activePage === 'dashboard' && (
            <TcDashboardView {...shared} queue={queue} allSales={sales} onNavigate={handleNavigate} onCompleteFollowup={handleCompleteFollowup} />
          )}
          {activePage === 'leads' && <TcLeadsView {...shared} searchQuery={searchQuery} />}
          {activePage === 'followups' && (
            <TcFollowUpsView {...shared} searchQuery={searchQuery} onComplete={handleCompleteFollowup} />
          )}
          {activePage === 'complaints' && (
            <TcComplaintsView complaints={complaints} searchQuery={searchQuery} onAdvance={handleAdvanceComplaint} />
          )}
          {activePage === 'sales' && <TcSalesView {...shared} />}
          {activePage === 'reports' && <TcReportsView {...shared} onToast={showToast} />}
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
        title="My Alerts"
      />

      {/* Log call */}
      <Modal isOpen={callTarget !== null} onClose={() => setCallTarget(null)} title={`Log call · ${callTarget?.lead.customer_name ?? ''}`}>
        {callTarget && (
          <form onSubmit={handleLogCall}>
            <div className="call-context">
              <a className="call-btn" href={`tel:+91${callTarget.lead.phone}`}>📞 {callTarget.lead.phone}</a>
              <span className="loc">{verticalName(callTarget.lead.vertical_id)} · {stageOf(callTarget.lead.stage_id)?.name}</span>
            </div>
            {callTarget.followup && <div className="loc" style={{ marginBottom: 12 }}>Follow-up: {callTarget.followup.note}</div>}
            <div className="form-group">
              <label>Outcome</label>
              <div className="outcome-picker">
                {OUTCOMES.map(o => (
                  <button type="button" key={o} className={`filter-chip ${callOutcome === o ? 'active' : ''}`} onClick={() => setCallOutcome(o)}>{o}</button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Move to stage</label>
                <select value={callStage} onChange={e => setCallStage(Number(e.target.value))}>
                  {stagesFor(callTarget.lead.vertical_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {callOutcome === 'Connected' && (
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" min={0} step={0.5} placeholder="e.g. 3.5" value={callMinutes} onChange={e => setCallMinutes(e.target.value)} />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea rows={2} placeholder="What was discussed, next step…" value={callNote} onChange={e => setCallNote(e.target.value)} />
            </div>
            {callTarget.followup && callOutcome === 'Connected' && (
              <label className="check-filter" style={{ marginBottom: 10 }}>
                <input type="checkbox" checked={closeFollowup} onChange={e => setCloseFollowup(e.target.checked)} /> Mark this follow-up done
              </label>
            )}
            <label className="check-filter" style={{ marginBottom: 10, display: 'flex' }}>
              <input type="checkbox" checked={scheduleNext} onChange={e => setScheduleNext(e.target.checked)} /> Schedule a follow-up
            </label>
            {scheduleNext && (
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <input type="text" placeholder="e.g. Confirm quantity" value={nextNote} onChange={e => setNextNote(e.target.value)} />
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setCallTarget(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save call</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Record sale */}
      <Modal isOpen={saleOpen} onClose={() => setSaleOpen(false)} title="Record sale">
        <form onSubmit={handleRecordSale}>
          <div className="form-group">
            <label>Lead</label>
            <select
              value={saleLeadId ?? ''}
              onChange={e => {
                const lead = myLeads.find(l => l.id === Number(e.target.value));
                setSaleLeadId(lead?.id ?? null);
                setSaleProductId(productsFor(lead)[0]?.id ?? 0);
                setSaleMarkWon(!!lead && !isWonStage(stageOf(lead.stage_id)));
              }}
              required
            >
              <option value="" disabled>Choose a lead…</option>
              {myLeads.filter(l => stageOf(l.stage_id)?.name !== 'Lost').map(l => (
                <option key={l.id} value={l.id}>{l.customer_name} · {verticalName(l.vertical_id)} · {stageOf(l.stage_id)?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Product</label>
              <select value={saleProductId} onChange={e => setSaleProductId(Number(e.target.value))} required>
                {productsFor(saleLead).map(p => <option key={p.id} value={p.id}>{p.name} · ₹{p.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min={1} value={saleQty} onChange={e => setSaleQty(e.target.value)} />
            </div>
          </div>
          {saleLead && wonStageFor(saleLead.vertical_id) && !isWonStage(stageOf(saleLead.stage_id)) && (
            <label className="check-filter" style={{ marginBottom: 12, display: 'flex' }}>
              <input type="checkbox" checked={saleMarkWon} onChange={e => setSaleMarkWon(e.target.checked)} />
              Move lead to “{wonStageFor(saleLead.vertical_id)?.name}”
            </label>
          )}
          <div className="form-total">Amount: <strong>{rupees(saleAmount)}</strong></div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setSaleOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!saleLead || !saleProduct}>Save sale</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
