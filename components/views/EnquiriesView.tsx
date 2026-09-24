import React, { useMemo, useState } from 'react';
import { Mail, MessageCircle, Phone, X } from 'lucide-react';
import {
  TODAY,
  TELECALLERS,
  VERTICALS,
  EnquiryStatus,
  EnquiryType,
  SalesOrder,
  TrackerLead,
  WebEnquiry,
} from '../../data/managerDashboard';
import { MONTH, ORDER_CHIP, ago, daysBefore, nowStamp, rupees, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';

interface EnquiriesViewProps {
  enquiries: WebEnquiry[];
  onEnquiriesChange: React.Dispatch<React.SetStateAction<WebEnquiry[]>>;
  leads: TrackerLead[];
  orders: SalesOrder[];
  onConvertToLead: (enquiry: WebEnquiry, verticalId: number, callerId: number) => void;
  onMoveToOnboarding: (enquiry: WebEnquiry) => void;
  onToast: (message: string) => void;
}

const STATUSES: EnquiryStatus[] = ['new', 'read', 'replied', 'archived'];
const TYPES: EnquiryType[] = ['sales', 'partnership', 'career', 'general'];
const STATUS_CHIP: Record<EnquiryStatus, string> = { new: 'pending', read: 'transit', replied: 'delivered', archived: 'muted' };
const PAGE_SIZE = 15;

type Alert = 'new-24h' | 'sales-2d' | 'read-no-reply';
type DateRange = '7d' | 'month' | 'all';

const ALERTS: Record<Alert, { label: string; test: (e: WebEnquiry) => boolean }> = {
  'new-24h': { label: 'new for over 24 hours', test: e => e.status === 'new' && daysBefore(e.created_at) >= 1 },
  'sales-2d': { label: 'sales enquiries unanswered 2+ days', test: e => e.type === 'sales' && (e.status === 'new' || e.status === 'read') && daysBefore(e.created_at) >= 2 },
  'read-no-reply': { label: 'read but never replied', test: e => e.status === 'read' },
};

const hoursBetween = (from: string, to: string) =>
  (new Date(`${to}:00`).getTime() - new Date(`${from}:00`).getTime()) / 3_600_000;
const callerName = (id: number) => TELECALLERS.find(t => t.id === id)?.name ?? '—';
const firstName = (name: string) => name.split(' ')[0];

const replyTemplate = (e: WebEnquiry) =>
  `Hello ${firstName(e.name)},\n\nThank you for contacting Manikstu Agri Network.\n\n\n\nRegards,\nManikstu Team\n+91 674 290182`;

export default function EnquiriesView({
  enquiries,
  onEnquiriesChange,
  leads,
  orders,
  onConvertToLead,
  onMoveToOnboarding,
  onToast,
}: EnquiriesViewProps) {
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EnquiryType | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [leadVertical, setLeadVertical] = useState(VERTICALS[0].id);
  const [leadCaller, setLeadCaller] = useState(TELECALLERS[0].id);

  // 1. Summary tiles
  const month = enquiries.filter(e => e.created_at.startsWith(MONTH));
  const newOnes = enquiries.filter(e => e.status === 'new');
  const repliedMonth = enquiries.filter(e => e.replied_at?.startsWith(MONTH));
  const avgReplyHours = repliedMonth.length
    ? repliedMonth.reduce((a, e) => a + hoursBetween(e.created_at, e.replied_at!), 0) / repliedMonth.length
    : 0;
  const tiles = {
    newCount: newOnes.length,
    oldestNew: Math.max(0, ...newOnes.map(e => daysBefore(e.created_at))),
    waiting: enquiries.filter(e => e.status === 'read').length,
    replied: repliedMonth.length,
    avgReply: avgReplyHours >= 24 ? `${(avgReplyHours / 24).toFixed(1)} days` : `${Math.round(avgReplyHours)} h`,
    sales: month.filter(e => e.type === 'sales').length,
    partnership: month.filter(e => e.type === 'partnership').length,
    career: month.filter(e => e.type === 'career').length,
  };

  // 2–3. Filtering
  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter(e => {
      if (alert) return ALERTS[alert].test(e);
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      const age = daysBefore(e.created_at);
      if (dateRange === '7d' && age > 6) return false;
      if (dateRange === 'month' && !e.created_at.startsWith(MONTH)) return false;
      if (q && ![e.name, e.email, e.phone ?? ''].some(v => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [enquiries, alert, typeFilter, dateRange, query]);

  const filtered = statusFilter === 'all' ? baseFiltered : baseFiltered.filter(e => e.status === statusFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const open = enquiries.find(e => e.id === openId) ?? null;
  const resetPage = () => { setPage(0); setSelected(new Set()); };

  // ---- Updates -----------------------------------------------------------------------------
  const patch = (ids: number[], change: (e: WebEnquiry) => WebEnquiry | null, message: string) => {
    let changed = 0;
    const next = enquiries.map(e => {
      if (!ids.includes(e.id)) return e;
      const updated = change(e);
      if (updated) changed++;
      return updated ?? e;
    });
    if (changed === 0) {
      onToast('Nothing to change for the selected enquiries');
      return;
    }
    onEnquiriesChange(next);
    onToast(message.replace('{n}', String(changed)));
  };

  const markRead = (ids: number[]) =>
    patch(ids, e => (e.status === 'new' ? { ...e, status: 'read' } : null), ids.length === 1 ? 'Marked as read' : '{n} marked as read');
  const markReplied = (ids: number[]) =>
    patch(ids, e => (e.status === 'new' || e.status === 'read' ? { ...e, status: 'replied', replied_at: nowStamp() } : null),
      ids.length === 1 ? 'Marked as replied' : '{n} marked as replied');
  const archive = (ids: number[]) =>
    patch(ids, e => (e.status !== 'archived' ? { ...e, status: 'archived' } : null), ids.length === 1 ? 'Archived' : '{n} archived');
  const restore = (id: number) =>
    patch([id], e => ({ ...e, status: e.replied_at ? 'replied' : 'read' }), 'Moved back to inbox');

  const openEnquiry = (e: WebEnquiry) => {
    setOpenId(e.id);
    setReplyDraft(replyTemplate(e));
    setNoteDraft(e.admin_notes ?? '');
    // Same as the backend: opening a new enquiry marks it read.
    if (e.status === 'new') onEnquiriesChange(prev => prev.map(x => (x.id === e.id ? { ...x, status: 'read' } : x)));
  };

  const saveNote = (id: number) => {
    onEnquiriesChange(prev => prev.map(e => (e.id === id ? { ...e, admin_notes: noteDraft.trim() || null } : e)));
    onToast('Note saved');
  };

  const exportRows = async (rows: WebEnquiry[], format: ExportFormat, scope: string) => {
    if (rows.length === 0) {
      onToast('No enquiries to export');
      return;
    }
    try {
      await exportTable(format, {
        filename: `enquiries-${TODAY}`,
        title: 'Website Enquiries',
        subtitle: `${rows.length} ${rows.length === 1 ? 'enquiry' : 'enquiries'} · ${scope} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Received', width: 16 },
          { header: 'Name', width: 20 },
          { header: 'Email', width: 28 },
          { header: 'Phone', width: 13 },
          { header: 'Type', width: 11 },
          { header: 'Status', width: 10 },
          { header: 'Replied', width: 16 },
          { header: 'Message', width: 50 },
          { header: 'Notes', width: 26 },
        ],
        rows: rows.map(e => [
          shortDateTime(e.created_at), e.name, e.email, e.phone, e.type, e.status,
          e.replied_at ? shortDateTime(e.replied_at) : '', e.message, e.admin_notes,
        ]),
      });
      onToast(`Exported ${rows.length} ${rows.length === 1 ? 'enquiry' : 'enquiries'} to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  // ---- Selection ---------------------------------------------------------------------------
  const allOnPageSelected = pageRows.length > 0 && pageRows.every(e => selected.has(e.id));
  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const togglePage = () => setSelected(prev => {
    const next = new Set(prev);
    pageRows.forEach(e => (allOnPageSelected ? next.delete(e.id) : next.add(e.id)));
    return next;
  });
  const selectedIds = Array.from(selected);

  // Detail panel extras
  const pastOrders = open?.phone ? orders.filter(o => o.phone === open.phone) : [];
  const linkedLead = open?.lead_id ? leads.find(l => l.id === open.lead_id) : undefined;
  const mailto = open
    ? `mailto:${open.email}?subject=${encodeURIComponent('Re: your enquiry to Manikstu')}&body=${encodeURIComponent(replyDraft)}`
    : '';

  return (
    <>
      {/* 1. Summary tiles */}
      <div className="scoreboard">
        <div className="score">
          <div className="num">{tiles.newCount} <small className="warn">oldest {tiles.oldestNew}d</small></div>
          <div className="label">New / unread</div>
        </div>
        <div className="score">
          <div className="num">{tiles.waiting}</div>
          <div className="label">Read, waiting for reply</div>
        </div>
        <div className="score">
          <div className="num">{tiles.replied} <small>avg {tiles.avgReply}</small></div>
          <div className="label">Replied · this month</div>
        </div>
        <div className="score">
          <div className="num">{tiles.sales}</div>
          <div className="label">Sales enquiries · this month</div>
        </div>
        <div className="score">
          <div className="num">{tiles.partnership}</div>
          <div className="label">Partnership · this month</div>
        </div>
        <div className="score">
          <div className="num">{tiles.career}</div>
          <div className="label">Career · this month</div>
        </div>
      </div>

      {/* 2. Needs-action strip */}
      <div className="alert-strip">
        <span className="alert-strip-label">Needs action</span>
        {(Object.keys(ALERTS) as Alert[]).map(key => {
          const n = enquiries.filter(ALERTS[key].test).length;
          return (
            <button
              key={key}
              className={`alert-pill ${alert === key ? 'active' : ''} ${n === 0 ? 'zero' : ''}`}
              onClick={() => { setAlert(alert === key ? null : key); setStatusFilter('all'); resetPage(); }}
            >
              <strong>{n}</strong> {ALERTS[key].label}
            </button>
          );
        })}
        {alert && <button className="link-btn clear-alert" onClick={() => { setAlert(null); resetPage(); }}>Show all enquiries</button>}
      </div>

      {/* 3. Filters */}
      <div className="page-toolbar">
        <div className="filters">
          {(['all', ...STATUSES] as const).map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => { setStatusFilter(s); resetPage(); }}
            >
              <span style={{ textTransform: 'capitalize' }}>{s}</span> ({s === 'all' ? baseFiltered.length : baseFiltered.filter(e => e.status === s).length})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <ExportMenu onExport={format => exportRows(filtered, format, 'current filters')} />
        </div>
      </div>

      <div className="filter-row">
        <input
          className="filter-input"
          type="search"
          placeholder="Search name, email, phone…"
          value={query}
          onChange={e => { setQuery(e.target.value); resetPage(); }}
        />
        <select className="filter-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value as EnquiryType | 'all'); resetPage(); }} aria-label="Type">
          <option value="all">All types</option>
          {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t[0].toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={dateRange} onChange={e => { setDateRange(e.target.value as DateRange); resetPage(); }} aria-label="Date range">
          <option value="7d">Last 7 days</option>
          <option value="month">This month</option>
          <option value="all">All time</option>
        </select>
        {alert && <span className="filter-note">Other filters are paused while a “Needs action” filter is on.</span>}
      </div>

      {/* 4. Bulk actions */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          <button className="btn-secondary btn-small" onClick={() => markRead(selectedIds)}>Mark read</button>
          <button className="btn-secondary btn-small" onClick={() => markReplied(selectedIds)}>Mark replied</button>
          <button className="btn-secondary btn-small" onClick={() => archive(selectedIds)}>Archive</button>
          <ExportMenu small label="Export selected" onExport={format => exportRows(enquiries.filter(e => selected.has(e.id)), format, 'selected')} />
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* 5. Inbox */}
      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table enquiries-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" /></th>
                <th>From</th>
                <th>Type</th>
                <th>Message</th>
                <th>Received</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '28px 0' }}>
                    No enquiries match these filters.
                  </td>
                </tr>
              ) : pageRows.map(e => {
                const age = daysBefore(e.created_at);
                const late = (e.status === 'new' && age >= 1) || ALERTS['sales-2d'].test(e);
                return (
                  <tr key={e.id} className={`${e.status === 'new' ? 'row-unread' : ''} ${selected.has(e.id) ? 'row-selected' : ''}`}>
                    <td><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} aria-label={`Select enquiry from ${e.name}`} /></td>
                    <td className="cust">
                      <button className="link-btn enq-name" onClick={() => openEnquiry(e)}>{e.name}</button>
                      {e.customer_id !== null && <span className="type-tag customer-tag">Customer</span>}
                      <div className="loc">{e.email}{e.phone ? ` · ${e.phone}` : ''}</div>
                    </td>
                    <td><span className={`type-tag enq-type ${e.type}`}>{e.type}</span></td>
                    <td className="enq-message">
                      <span>{e.message}</span>
                      {e.lead_id !== null && <div className="loc">→ Lead #{e.lead_id}</div>}
                    </td>
                    <td>
                      {shortDateTime(e.created_at)}
                      <div className={`loc ${late ? 'text-warn' : ''}`}>{ago(e.created_at)}</div>
                    </td>
                    <td><span className={`chip ${STATUS_CHIP[e.status]}`}>{e.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="kanban-btn" onClick={() => openEnquiry(e)}>{e.status === 'replied' || e.status === 'archived' ? 'View' : 'Reply'}</button>
                        {e.status === 'archived'
                          ? <button className="kanban-btn" onClick={() => restore(e.id)}>Restore</button>
                          : <button className="kanban-btn" onClick={() => archive([e.id])}>Archive</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{filtered.length === 0 ? '0 enquiries' : `${safePage * PAGE_SIZE + 1}–${Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of ${filtered.length} enquiries`}</span>
          <div className="pager-btns">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      </div>

      <div className="panel-note">
        Sample data. The backend doesn’t send reply emails or store the reply text, who replied, who the enquiry is assigned to,
        the lead it was converted to, or which page it came from.
      </div>

      {/* 6. Detail drawer */}
      {open && (
        <>
          <div className="drawer-overlay" onClick={() => setOpenId(null)} />
          <aside className="order-drawer" role="dialog" aria-label={`Enquiry from ${open.name}`}>
            <div className="drawer-head">
              <div>
                <h3>{open.name}</h3>
                <div className="loc">
                  <span className={`type-tag enq-type ${open.type}`}>{open.type}</span>{' '}
                  <span className={`chip ${STATUS_CHIP[open.status]}`}>{open.status}</span>{' '}
                  · received {shortDateTime(open.created_at)}
                </div>
              </div>
              <button className="modal-close" onClick={() => setOpenId(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="drawer-body">
              <section className="od-section">
                <div className="od-label">Message</div>
                <p className="enq-full-message">{open.message}</p>
              </section>

              <section className="od-section">
                <div className="od-label">Contact</div>
                <div className="loc" style={{ marginBottom: 10 }}>{open.email}{open.phone ? ` · ${open.phone}` : ' · no phone given'}</div>
                <div className="contact-btns">
                  {open.phone && <a className="call-btn" href={`tel:+91${open.phone}`}><Phone size={13} /> Call</a>}
                  <a className="call-btn" href={`mailto:${open.email}`}><Mail size={13} /> Email</a>
                  {open.phone && (
                    <a className="call-btn whatsapp" href={`https://wa.me/91${open.phone}?text=${encodeURIComponent(`Hello ${firstName(open.name)}, this is Manikstu Agri Network replying to your enquiry.`)}`} target="_blank" rel="noreferrer">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </section>

              {open.status !== 'archived' && (
                <section className="od-section">
                  <div className="od-label">Reply {open.replied_at && <span className="od-label-note">· last replied {shortDateTime(open.replied_at)}</span>}</div>
                  <textarea className="od-notes" rows={7} value={replyDraft} onChange={e => setReplyDraft(e.target.value)} />
                  <a
                    className="btn-primary btn-small"
                    href={mailto}
                    onClick={() => { if (open.status !== 'replied') markReplied([open.id]); }}
                  >
                    Open in email app &amp; mark replied
                  </a>
                </section>
              )}

              {(open.type === 'sales' || open.type === 'general') && (
                <section className="od-section">
                  <div className="od-label">Telecalling lead</div>
                  {linkedLead ? (
                    <div className="loc">
                      Converted to lead #{linkedLead.id} · assigned to <strong>{callerName(linkedLead.assigned_to)}</strong>
                    </div>
                  ) : !open.phone ? (
                    <div className="loc">No phone number, so this can’t go to a telecaller. Reply by email first and ask for a number.</div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Vertical</label>
                          <select value={leadVertical} onChange={e => setLeadVertical(Number(e.target.value))}>
                            {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Assign to</label>
                          <select value={leadCaller} onChange={e => setLeadCaller(Number(e.target.value))}>
                            {TELECALLERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <button className="btn-secondary btn-small" onClick={() => onConvertToLead(open, leadVertical, leadCaller)}>
                        Convert to lead
                      </button>
                    </>
                  )}
                </section>
              )}

              {open.type === 'career' && (
                <section className="od-section">
                  <div className="od-label">Hiring</div>
                  <button className="btn-secondary btn-small" onClick={() => onMoveToOnboarding(open)}>Move to User onboarding</button>
                </section>
              )}

              {open.customer_id !== null && (
                <section className="od-section">
                  <div className="od-label">Existing customer · {pastOrders.length} {pastOrders.length === 1 ? 'order' : 'orders'}</div>
                  <ul className="attn-list">
                    {pastOrders.slice(0, 4).map(o => (
                      <li key={o.id}>
                        <div>
                          <div className="name">{o.order_number}</div>
                          <div className="action">{o.items.map(it => it.product_name).join(', ')} · {shortDateTime(o.created_at)}</div>
                        </div>
                        <div className="attn-side">
                          <span className="strong">{rupees(o.total)}</span>
                          <span className={`chip ${ORDER_CHIP[o.status]}`} style={{ textTransform: 'capitalize' }}>{o.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="od-section">
                <div className="od-label">Admin notes</div>
                <textarea
                  className="od-notes"
                  rows={3}
                  placeholder="Add a note for the team…"
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                />
                {noteDraft !== (open.admin_notes ?? '') && (
                  <button className="btn-secondary btn-small" onClick={() => saveNote(open.id)}>Save note</button>
                )}
              </section>
            </div>

            <div className="drawer-actions">
              {(open.status === 'new' || open.status === 'read') && (
                <button className="btn-secondary" onClick={() => markReplied([open.id])}>Mark replied</button>
              )}
              {open.status === 'archived'
                ? <button className="btn-secondary" onClick={() => restore(open.id)}>Restore to inbox</button>
                : <button className="btn-secondary" onClick={() => { archive([open.id]); setOpenId(null); }}>Archive</button>}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
