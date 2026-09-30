import React, { useMemo, useState } from 'react';
import { CheckCheck, Download, Megaphone, MessageCircle, Search, Send, Users, X } from 'lucide-react';
import { SalesOrder, TODAY } from '../../data/managerDashboard';
import { AUDIENCES, AudienceKey, Campaign, Recipient, TEMPLATES, fillTemplate, whatsappTo } from '../../data/marketing';
import { daysBefore, nowStamp, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import { TeamData, callerName, isOpenLead, stageName, stageOf, verticalName } from './tcData';

const QUEUE_PAGE = 12;
const CONTACT_PAGE = 10;

interface Props {
  data: TeamData;
  orders: SalesOrder[];
  campaigns: Campaign[];
  onCampaignsChange: (c: Campaign[]) => void;
  onToast: (message: string) => void;
}

interface Contact {
  name: string;
  phone: string;
  /** Last product bought, for buyers; the product line asked about, for leads. */
  product: string;
  place: string;
  detail: string;
  /** Last order, or last time the lead was worked. */
  when: string;
  kind: 'customer' | 'lead';
}

/** WhatsApp marketing: pick who to reach, write the message, then send it chat by chat. */
export default function TeamMarketing({ data, orders, campaigns, onCampaignsChange, onToast }: Props) {
  // Audiences, one contact per phone number
  const audiences = useMemo(() => {
    const byPhone = new Map<string, { name: string; count: number; last: string; product: string; city: string }>();
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const c = byPhone.get(o.phone);
      if (!c) byPhone.set(o.phone, { name: o.customer_name, count: 1, last: o.created_at, product: o.items[0].product_name, city: o.city });
      else { c.count++; if (o.created_at > c.last) { c.last = o.created_at; c.product = o.items[0].product_name; c.city = o.city; } }
    });
    const buyers = Array.from(byPhone, ([phone, c]) => ({ phone, ...c }));
    const leadList = (test: (l: typeof data.leads[number]) => boolean): Contact[] => {
      const seen = new Set<string>();
      return data.leads.filter(test).filter(l => !seen.has(l.phone) && seen.add(l.phone)).map(l => ({
        name: l.customer_name, phone: l.phone, product: verticalName(l.vertical_id), place: l.source,
        detail: `${stageName(l.stage_id)} · ${callerName(l.assigned_to)}`, when: l.updated_at, kind: 'lead' as const,
      }));
    };
    const toContact = (b: typeof buyers[number]): Contact => ({
      name: b.name, phone: b.phone, product: b.product, place: b.city,
      detail: `${b.count} order${b.count === 1 ? '' : 's'}`, when: b.last, kind: 'customer',
    });
    const customers = buyers.map(toContact);
    const buyerPhones = new Set(customers.map(c => c.phone));
    const everyone = [...customers, ...leadList(() => true).filter(c => !buyerPhones.has(c.phone))];
    return {
      everyone,
      buyers: customers,
      repeat: buyers.filter(b => b.count >= 2).map(toContact),
      lapsed: buyers.filter(b => daysBefore(b.last) >= 30).map(toContact),
      'open-leads': leadList(isOpenLead),
      'lost-leads': leadList(l => stageOf(l.stage_id)?.name === 'Lost'),
    } as Record<AudienceKey, Contact[]>;
  }, [orders, data.leads]);

  const reachable = audiences.everyone.length;
  const products = useMemo(() => Array.from(new Set(orders.flatMap(o => o.items.map(i => i.product_name)))).sort(), [orders]);

  // Composer
  const [audience, setAudience] = useState<AudienceKey>('everyone');
  const [templateKey, setTemplateKey] = useState(TEMPLATES[0].key);
  const [product, setProduct] = useState(products[0] ?? '');
  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [name, setName] = useState('');
  const pickTemplate = (key: string) => { setTemplateKey(key); setMessage(TEMPLATES.find(t => t.key === key)!.text); };
  const contacts = audiences[audience];
  const [contactQuery, setContactQuery] = useState('');
  const [contactPage, setContactPage] = useState(0);
  const cq = contactQuery.trim().toLowerCase();
  const [kind, setKind] = useState<'all' | 'customer' | 'lead'>('all');
  const shownContacts = audiences.everyone
    .filter(c => kind === 'all' || c.kind === kind)
    .filter(c => !cq || [c.name, c.phone].some(v => v.toLowerCase().includes(cq)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const contactPages = Math.max(1, Math.ceil(shownContacts.length / CONTACT_PAGE));
  const safeContactPage = Math.min(contactPage, contactPages - 1);
  const previewName = contacts[0]?.name ?? 'Ramesh Nayak';
  const defaultName = `${TEMPLATES.find(t => t.key === templateKey)!.label} · ${product}`;

  // Send queue
  const [openId, setOpenId] = useState<number | null>(null);
  const [queuePage, setQueuePage] = useState(0);
  const open = campaigns.find(c => c.id === openId && !c.sample) ?? null;

  const createCampaign = () => {
    if (contacts.length === 0) { onToast('Nobody in this audience yet'); return; }
    if (!message.trim()) { onToast('Write a message first'); return; }
    const id = Math.max(0, ...campaigns.map(c => c.id)) + 1;
    const recipients: Recipient[] = contacts.map(c => ({ name: c.name, phone: c.phone, text: fillTemplate(message, c.name, product), sent: false }));
    onCampaignsChange([{ id, name: name.trim() || defaultName, audience, templateKey, product, created_at: nowStamp(), recipients }, ...campaigns]);
    setOpenId(id);
    setQueuePage(0);
    setName('');
    onToast(`Campaign ready: ${recipients.length} messages to send`);
  };

  const markSent = (campaignId: number, phone: string) => {
    onCampaignsChange(campaigns.map(c => (c.id === campaignId ? { ...c, recipients: c.recipients.map(r => (r.phone === phone ? { ...r, sent: true } : r)) } : c)));
  };

  const exportList = async (c: Campaign, format: ExportFormat) => {
    try {
      await exportTable(format, {
        filename: `whatsapp-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${TODAY}`,
        title: `WhatsApp campaign · ${c.name}`,
        subtitle: `${c.recipients.length} contacts · ${AUDIENCES.find(a => a.key === c.audience)!.label}`,
        columns: [{ header: 'Name', width: 20 }, { header: 'Phone', width: 13 }, { header: 'Message', width: 60 }, { header: 'Sent', width: 7 }],
        rows: c.recipients.map(r => [r.name, r.phone, r.text, r.sent ? 'Yes' : 'No']),
      });
      onToast('Contact list downloaded: import it into a WhatsApp Business broadcast list');
    } catch {
      onToast('Download failed. Please try again.');
    }
  };

  // Tiles
  const month = TODAY.slice(0, 7);
  const thisMonth = campaigns.filter(c => c.created_at.startsWith(month));
  const sentOf = (c: Campaign) => c.sample ? c.sample.sent : c.recipients.filter(r => r.sent).length;
  const sentMonth = thisMonth.reduce((a, c) => a + sentOf(c), 0);
  const sampled = campaigns.filter(c => c.sample);
  const replyRate = Math.round((sampled.reduce((a, c) => a + c.sample!.replies, 0) / Math.max(1, sampled.reduce((a, c) => a + c.sample!.sent, 0))) * 100);

  const TILES = [
    { icon: Users, n: reachable, label: 'Contacts on WhatsApp' },
    { icon: Megaphone, n: thisMonth.length, label: 'Campaigns this month' },
    { icon: Send, n: sentMonth, label: 'Messages sent this month' },
    { icon: MessageCircle, n: `${replyRate}%`, label: 'Reply rate · past campaigns' },
  ];

  const queueRows = open ? open.recipients.slice(queuePage * QUEUE_PAGE, (queuePage + 1) * QUEUE_PAGE) : [];
  const queuePages = open ? Math.max(1, Math.ceil(open.recipients.length / QUEUE_PAGE)) : 1;
  const openSent = open ? open.recipients.filter(r => r.sent).length : 0;

  return (
    <>
      <div className="fu-tiles">
        {TILES.map(({ icon: Icon, n, label }) => (
          <div key={label} className="stat-tile">
            <Icon className="stat-icon" size={22} />
            <div className="num">{n}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {/* Composer + preview */}
      <div className="mk-compose">
        <div className="panel mk-form">
          <div className="panel-head"><h2>New WhatsApp campaign</h2><span className="panel-meta">3 steps</span></div>

          <div className="mk-step"><span className="mk-step-n">1</span> Who should get it?</div>
          <div className="mk-audiences">
            {AUDIENCES.map(a => (
              <button key={a.key} className={`mk-audience ${audience === a.key ? 'on' : ''}`} onClick={() => setAudience(a.key)}>
                <span className="mk-audience-n">{audiences[a.key].length}</span>
                <span className="mk-audience-label">{a.label}</span>
                <span className="mk-audience-hint">{a.hint}</span>
              </button>
            ))}
          </div>

          <div className="mk-step"><span className="mk-step-n">2</span> What should it say?</div>
          <div className="lf-pills mk-templates">
            {TEMPLATES.map(t => (
              <button key={t.key} className={`lf-pill ${templateKey === t.key ? 'on' : ''}`} onClick={() => pickTemplate(t.key)}>{t.label}</button>
            ))}
          </div>
          <div className="mk-fields">
            <label className="form-group">
              <span>Product</span>
              <select className="filter-select" value={product} onChange={e => setProduct(e.target.value)}>
                {products.map(p => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="form-group">
              <span>Campaign name</span>
              <input className="filter-input" value={name} placeholder={defaultName} onChange={e => setName(e.target.value)} />
            </label>
          </div>
          <label className="form-group mk-message">
            <span>Message · {'{name}'} and {'{product}'} are filled in for each person</span>
            <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} />
          </label>

          <div className="mk-step mk-step-last"><span className="mk-step-n">3</span> Send</div>
          <div className="mk-send-row">
            <button className="btn-primary" onClick={createCampaign}><Send size={15} /> Prepare {contacts.length} messages</button>
            <span className="loc">You then send each one on WhatsApp with one tap, or download the list for a WhatsApp Business broadcast.</span>
          </div>
        </div>

        <div className="stack mk-side">
        <div className="panel mk-preview-panel">
          <div className="panel-head"><h2>Preview</h2><span className="panel-meta">as {previewName.split(' ')[0]} sees it</span></div>
          <div className="mk-phone">
            <div className="mk-phone-top"><span className="avatar">M</span><div><strong>Manikstu</strong><div>online</div></div></div>
            <div className="mk-chat">
              <div className="mk-bubble">
                {fillTemplate(message || ' ', previewName, product)}
                <span className="mk-time">10:30 <CheckCheck size={13} /></span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mk-campaigns">
          <div className="panel-head"><h2>Campaigns</h2><span className="panel-meta">{campaigns.length} so far</span></div>
          <ul className="mk-c-list">
            {campaigns.map(c => {
              const total = c.sample ? c.sample.sent : c.recipients.length;
              const sent = sentOf(c);
              return (
                <li key={c.id}>
                  <div className="mk-c-top">
                    <strong>{c.name}</strong>
                    <span className="loc">{shortDate(c.created_at)}</span>
                  </div>
                  <div className="loc">{AUDIENCES.find(a => a.key === c.audience)?.label} · {TEMPLATES.find(t => t.key === c.templateKey)?.label}</div>
                  <div className="mk-c-stats">
                    <span><b>{c.sample ? sent : `${sent}/${total}`}</b> sent</span>
                    <span><b>{c.sample ? c.sample.replies : '—'}</b> replies</span>
                    <span><b>{c.sample ? c.sample.orders : '—'}</b> orders</span>
                    {!c.sample && (
                      <button className="link-btn mk-c-open" onClick={() => { setOpenId(c.id); setQueuePage(0); }}>{sent < total ? 'Continue' : 'View'}</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        </div>
      </div>

      {/* Send queue for the campaign being sent */}
      {open && (
        <div className="panel mk-queue">
          <div className="panel-head">
            <h2>Sending · {open.name}</h2>
            <div className="mk-queue-tools">
              <button className="btn-secondary btn-small" onClick={() => exportList(open, 'excel')}><Download size={14} /> Contact list</button>
              <button className="modal-close" onClick={() => setOpenId(null)} aria-label="Close"><X size={18} /></button>
            </div>
          </div>
          <div className="mk-progress">
            <div className="exec-load-bar"><span style={{ width: `${(openSent / Math.max(1, open.recipients.length)) * 100}%` }} /></div>
            <span><strong>{openSent}</strong> of {open.recipients.length} sent</span>
          </div>
          <ul className="mk-recipients">
            {queueRows.map(r => (
              <li key={r.phone} className={r.sent ? 'sent' : undefined}>
                <div className="mk-r-who"><strong>{r.name}</strong><span className="loc">{r.phone}</span></div>
                <div className="mk-r-text">{r.text}</div>
                {r.sent
                  ? <span className="chip delivered"><CheckCheck size={12} /> Sent</span>
                  : (
                    <a className="ord-wa" href={whatsappTo(r.phone, r.text)} target="_blank" rel="noreferrer" onClick={() => markSent(open.id, r.phone)}>
                      <MessageCircle size={14} /> Send
                    </a>
                  )}
              </li>
            ))}
          </ul>
          {queuePages > 1 && (
            <div className="pager">
              <span className="loc">Page {queuePage + 1} of {queuePages}</span>
              <div className="pager-btns">
                <button className="btn-secondary btn-small" disabled={queuePage === 0} onClick={() => setQueuePage(queuePage - 1)}>Previous</button>
                <button className="btn-secondary btn-small" disabled={queuePage >= queuePages - 1} onClick={() => setQueuePage(queuePage + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Every client: customers and connected farmers */}
      <div className="panel">
        <div className="panel-head mk-contacts-head">
          <h2>All clients</h2>
          <div className="mk-contacts-tools">
            <div className="lf-pills">
              {([['all', `All · ${audiences.everyone.length}`], ['customer', `Customers · ${audiences.buyers.length}`], ['lead', `Farmers · ${audiences.everyone.length - audiences.buyers.length}`]] as const).map(([k, label]) => (
                <button key={k} className={`lf-pill ${kind === k ? 'on' : ''}`} onClick={() => { setKind(k); setContactPage(0); }}>{label}</button>
              ))}
            </div>
            <div className="search mk-contacts-search">
              <Search size={15} style={{ color: 'var(--ink-soft)' }} />
              <input value={contactQuery} placeholder="Search name or phone…" onChange={e => { setContactQuery(e.target.value); setContactPage(0); }} />
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Type</th><th className="num-col">Send</th></tr>
            </thead>
            <tbody>
              {shownContacts.length === 0 && <tr><td colSpan={4} className="loc" style={{ textAlign: 'center', padding: 24 }}>Nobody{cq ? ' matches that search' : ' here yet'}.</td></tr>}
              {shownContacts.slice(safeContactPage * CONTACT_PAGE, (safeContactPage + 1) * CONTACT_PAGE).map(c => (
                <tr key={c.phone}>
                  <td className="cust">{c.name}</td>
                  <td>{c.phone}</td>
                  <td><span className={`chip ${c.kind === 'customer' ? 'delivered' : 'confirmed'}`}>{c.kind === 'customer' ? 'Customer' : 'Farmer'}</span></td>
                  <td className="num-col">
                    <a className="ord-wa" href={whatsappTo(c.phone, fillTemplate(message, c.name, product))} target="_blank" rel="noreferrer" title="Send the campaign message to just this person">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contactPages > 1 && (
          <div className="pager">
            <span className="loc">Page {safeContactPage + 1} of {contactPages}</span>
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safeContactPage === 0} onClick={() => setContactPage(safeContactPage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safeContactPage >= contactPages - 1} onClick={() => setContactPage(safeContactPage + 1)}>Next</button>
            </div>
          </div>
        )}
        <div className="panel-note">
          Past campaigns and their replies and orders are sample data. Messages go out one chat at a time through WhatsApp on this device; sending to everyone at once, and counting replies, needs the WhatsApp Business API connected to the backend.
        </div>
      </div>
    </>
  );
}
