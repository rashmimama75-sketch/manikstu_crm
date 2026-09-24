import React from 'react';
import { TODAY, TRACKER_PRODUCTS } from '../../data/managerDashboard';
import { MONTH, pct, rupees, rupeesShort, shortDate } from '../../lib/format';
import HBarList from '../HBarList';
import { EmptyRow } from './shared';
import { TcSharedProps, productName } from './tcData';

export default function TcSalesView({ leads, sales, onSale }: TcSharedProps) {
  const month = sales.filter(s => s.sold_at.startsWith(MONTH));
  const revenue = month.reduce((a, s) => a + s.amount, 0);
  const soldLeadIds = new Set(sales.map(s => s.lead_id));
  const conversion = pct(leads.filter(l => soldLeadIds.has(l.id)).length, leads.length);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(`${TODAY}T00:00:00`);
    d.setDate(d.getDate() - (29 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const rows = sales.filter(s => s.sold_at === key);
    return { key, amount: rows.reduce((a, s) => a + s.amount, 0), count: rows.length };
  });
  const maxDay = Math.max(1, ...days.map(d => d.amount));

  const byProduct = TRACKER_PRODUCTS
    .map(p => {
      const rows = month.filter(s => s.product_id === p.id);
      return { p, amount: rows.reduce((a, s) => a + s.amount, 0), units: rows.reduce((a, s) => a + s.quantity, 0) };
    })
    .filter(r => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const recent = [...sales].sort((a, b) => b.sold_at.localeCompare(a.sold_at) || b.id - a.id).slice(0, 10);

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{rupeesShort(revenue)}</div><div className="label">Sales · this month</div></div>
        <div className="score"><div className="num">{month.length}</div><div className="label">Sales made</div></div>
        <div className="score"><div className="num">{month.length ? rupees(revenue / month.length) : '—'}</div><div className="label">Average sale</div></div>
        <div className="score"><div className="num">{conversion}%</div><div className="label">Leads converted</div></div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>My sales · last 30 days</h2>
          <button className="btn-primary btn-small" onClick={() => onSale()}>+ Record sale</button>
        </div>
        <div className="bar-chart dense" role="img" aria-label={`Daily sales for the last 30 days`}>
          {days.map((d, i) => (
            <div key={d.key} className="bc-col" data-tip={`${shortDate(d.key)} · ${rupees(d.amount)} · ${d.count} sales`}>
              <div className={`bc-bar ${d.key === TODAY ? 'now' : ''}`} style={{ height: `${(d.amount / maxDay) * 100}%` }} />
              <div className="bc-label">{i % 5 === 4 || d.key === TODAY ? shortDate(d.key) : ' '}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>By product</h2><span className="panel-meta">This month</span></div>
          {byProduct.length === 0
            ? <div className="loc">No sales yet this month.</div>
            : <HBarList rows={byProduct.map(r => ({ key: String(r.p.id), label: r.p.name, value: r.amount, display: rupeesShort(r.amount), tip: `${r.p.name}: ${rupees(r.amount)} · ${r.units} units` }))} />}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Recent sales</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Customer</th><th>Product</th><th className="num-col">Amount</th></tr></thead>
              <tbody>
                {recent.length === 0 && <EmptyRow cols={4} text="No sales recorded yet." />}
                {recent.map(s => (
                  <tr key={s.id}>
                    <td>{shortDate(s.sold_at)}</td>
                    <td className="cust">{s.customer_name}</td>
                    <td>{productName(s.product_id)} × {s.quantity}</td>
                    <td className="num-col strong">{rupees(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
