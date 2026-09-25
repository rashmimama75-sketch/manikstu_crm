import React, { useState } from 'react';
import { SALES_ORDERS, SalesOrder } from '../../data/managerDashboard';
import { CATEGORIES, CHANNELS, Category, Channel, PRIORITIES, Priority, SLA_HOURS, suggestPriority } from '../../data/complaints';
import { rupees, shortDate } from '../../lib/format';
import Modal from '../Modal';
import { PRIORITY_LABEL } from './complaintsUtil';

export interface NewComplaintInput {
  customer_name: string;
  phone: string;
  city: string;
  order_number: string | null;
  product: string | null;
  category: Category;
  channel: Channel;
  description: string;
  priority: Priority;
  assignNow: boolean;
}

const digits = (s: string) => s.replace(/\D/g, '');

/** Log a complaint that came in by phone: find the order by phone or name, then describe the issue. */
export default function NewComplaint({ onSave, onClose }: { onSave: (c: NewComplaintInput) => void; onClose: () => void }) {
  const [lookup, setLookup] = useState('');
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState<Category>('Delivery delay');
  const [channel, setChannel] = useState<Channel>('Phone call');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null); // null = use the suggestion
  const [assignNow, setAssignNow] = useState(true);
  const [tried, setTried] = useState(false);

  const q = lookup.trim().toLowerCase();
  const matches = q.length < 3 ? [] : SALES_ORDERS
    .filter(o => (digits(q).length >= 3 && digits(o.phone).includes(digits(q))) || o.customer_name.toLowerCase().includes(q) || o.order_number.toLowerCase().includes(q))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const suggested = suggestPriority(category, order ?? undefined);
  const finalPriority = priority ?? suggested;

  const pickOrder = (o: SalesOrder) => {
    setOrder(o);
    setName(o.customer_name);
    setPhone(o.phone);
    setCity(o.city);
    setProduct(o.items[0]?.product_name ?? '');
    setLookup('');
  };

  const problems = [
    name.trim().length < 2 && 'Customer name',
    !/^[6-9]\d{9}$/.test(digits(phone).slice(-10)) && 'Valid 10-digit mobile',
    !city.trim() && 'Village / city',
    description.trim().length < 5 && 'What went wrong',
  ].filter(Boolean) as string[];

  const save = () => {
    setTried(true);
    if (problems.length) return;
    onSave({
      customer_name: name.trim(),
      phone: digits(phone).slice(-10),
      city: city.trim(),
      order_number: order?.order_number ?? null,
      product: product || null,
      category,
      channel,
      description: description.trim(),
      priority: finalPriority,
      assignNow,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="New complaint" closeOnBackdrop={false}>
      <div className="form-group">
        <label>Find the order (phone, name or order number)</label>
        <input value={lookup} onChange={e => setLookup(e.target.value)} placeholder="e.g. 98610 or Sabitri" autoFocus />
      </div>
      {matches.length > 0 && (
        <ul className="attn-list order-matches">
          {matches.map(o => (
            <li key={o.order_number}>
              <button type="button" className="link-btn" onClick={() => pickOrder(o)}>
                <span className="name">{o.customer_name}</span> · {o.phone} · {o.city}
                <div className="action">{o.order_number} · {shortDate(o.created_at)} · {o.items.map(i => i.product_name).join(', ')} · {rupees(o.total)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.length >= 3 && matches.length === 0 && <div className="loc" style={{ marginBottom: 10 }}>No order found. Fill in the customer below.</div>}
      {order && (
        <div className="panel-note" style={{ marginTop: 0, marginBottom: 12 }}>
          Linked to order <strong>{order.order_number}</strong> ({rupees(order.total)}, {order.status}).{' '}
          <button type="button" className="link-btn" onClick={() => { setOrder(null); setProduct(''); }}>Unlink</button>
        </div>
      )}

      <div className="form-row">
        <div className="form-group"><label>Customer name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="form-group"><label>Mobile</label><input inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Village / city</label><input value={city} onChange={e => setCity(e.target.value)} /></div>
        <div className="form-group">
          <label>Product</label>
          {order ? (
            <select className="filter-select" value={product} onChange={e => setProduct(e.target.value)}>
              {order.items.map(i => <option key={i.product_name}>{i.product_name}</option>)}
            </select>
          ) : (
            <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Optional" />
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select className="filter-select" value={category} onChange={e => setCategory(e.target.value as Category)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Came in by</label>
          <select className="filter-select" value={channel} onChange={e => setChannel(e.target.value as Channel)}>
            {CHANNELS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>What went wrong</label>
        <textarea className="od-notes" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="In the customer's words" />
      </div>
      <div className="form-group">
        <label>Priority</label>
        <div className="filters">
          {PRIORITIES.map(p => (
            <button key={p} type="button" className={`filter-chip ${finalPriority === p ? 'active' : ''}`} onClick={() => setPriority(p)}>
              {PRIORITY_LABEL[p]}{p === suggested ? ' (suggested)' : ''}
            </button>
          ))}
        </div>
        <div className="loc" style={{ marginTop: 6 }}>Deadline: {SLA_HOURS[finalPriority]} hours from now.</div>
      </div>
      <label className="check-line">
        <input type="checkbox" checked={assignNow} onChange={e => setAssignNow(e.target.checked)} /> Choose a telecaller right after saving
      </label>

      {tried && problems.length > 0 && <div className="inline-alert" style={{ marginTop: 12 }}>Still needed: {problems.join(', ')}.</div>}

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>Save complaint</button>
      </div>
    </Modal>
  );
}
