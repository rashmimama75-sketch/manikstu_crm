import React from 'react';
import { CONFIRMED_ORDERS, SALES_SUMMARY, SALES_TREND } from '../../data/telecallerData';

export default function TcSalesView() {
  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{SALES_SUMMARY.monthSales}</div><div className="label">Sales, this month</div></div>
        <div className="score"><div className="num">{SALES_SUMMARY.ordersConfirmed}</div><div className="label">Orders confirmed</div></div>
        <div className="score"><div className="num">{SALES_SUMMARY.conversionRate}</div><div className="label">Conversion rate</div></div>
        <div className="score"><div className="num">{SALES_SUMMARY.avgOrderValue}</div><div className="label">Avg. order value</div></div>
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <div className="panel-head"><h2>Sales, last 6 months</h2></div>
          <div className="bar-chart">
            {SALES_TREND.map((m, i) => (
              <div key={m.month} className="bc-col">
                <div className={`bc-bar ${i === SALES_TREND.length - 1 ? 'now' : ''}`} style={{ height: `${m.pct}%` }} />
                <div className="bc-label">{m.month}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Confirmed orders</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lead</th><th>Product</th><th>Amount</th></tr></thead>
              <tbody>
                {CONFIRMED_ORDERS.map(o => (
                  <tr key={o.lead + o.product}>
                    <td className="cust">{o.lead}</td>
                    <td>{o.product}</td>
                    <td>₹{o.amount.toLocaleString('en-IN')}</td>
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
