import React from 'react';
import { Customer } from '../../data/initialData';
import { SalesOrder } from '../../data/managerDashboard';
import { rupees, shortDate } from '../../lib/format';

interface FarmerDetailsViewProps {
  customer: Customer | null;
  orders: SalesOrder[];
  onBack: () => void;
}

export default function FarmerDetailsView({ customer, orders, onBack }: FarmerDetailsViewProps) {
  const current = customer || {
    id: 'C-001',
    name: 'Debasish Nayak',
    location: 'Cuttack',
    ordersCount: 14,
    lifetimeValue: 18600,
    lastOrder: '18 Sep',
    status: 'Active',
    phone: '98610 24810',
    landHolding: '4.5 acres',
    crops: ['Paddy', 'Vegetables'],
    livestock: { cows: 4, buffaloes: 2, goats: 8, sheep: 0, poultry: 25 }
  };

  const totalLivestock = Object.values(current.livestock).reduce((a, b) => a + b, 0);
  const digitsOnly = (v: string) => v.replace(/\D/g, '');
  const farmerOrders = orders
    .filter(o => digitsOnly(o.phone).slice(-10) === digitsOnly(current.phone).slice(-10))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <button className="back-link" onClick={onBack} style={{ background: 'none', border: 'none', padding: 0 }}>
        ← Back to customers
      </button>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="track-head">
          <div>
            <div className="track-order-id">Farmer Profile · ID: {current.id}</div>
            <h2 style={{ margin: '2px 0 0' }}>{current.name}</h2>
            <div className="sub" style={{ marginTop: 4 }}>
              {current.location}, Odisha · {current.phone}
            </div>
          </div>
          <div className="track-amount">
            <span className={`chip ${current.status === 'Active' ? 'delivered' : 'pending'}`}>
              {current.status}
            </span>
            <div className="track-amt-num">₹{current.lifetimeValue.toLocaleString()}</div>
            <div className="sub" style={{ marginTop: 2 }}>Lifetime Value</div>
          </div>
        </div>
      </div>

      <div className="scoreboard">
        <div className="score">
          <div className="num">{current.ordersCount}</div>
          <div className="label">Total Orders</div>
        </div>
        <div className="score">
          <div className="num">{current.landHolding}</div>
          <div className="label">Land Holding</div>
        </div>
        <div className="score">
          <div className="num">{current.lastOrder}</div>
          <div className="label">Last Order</div>
        </div>
        <div className="score">
          <div className="num">Bore Well</div>
          <div className="label">Irrigation Type</div>
        </div>
      </div>

      {/* Livestock Breakdown */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Livestock Inventory</h2>
          <span className="link">{totalLivestock} Animals Total</span>
        </div>
        <div className="livestock-grid">
          <div className="livestock-item">
            <div className="li-icon">🐄</div>
            <div className="li-num">{current.livestock.cows}</div>
            <div className="li-label">Cows</div>
          </div>
          <div className="livestock-item">
            <div className="li-icon">🐃</div>
            <div className="li-num">{current.livestock.buffaloes}</div>
            <div className="li-label">Buffaloes</div>
          </div>
          <div className="livestock-item">
            <div className="li-icon">🐐</div>
            <div className="li-num">{current.livestock.goats}</div>
            <div className="li-label">Goats</div>
          </div>
          <div className="livestock-item">
            <div className="li-icon">🐑</div>
            <div className="li-num">{current.livestock.sheep}</div>
            <div className="li-label">Sheep</div>
          </div>
          <div className="livestock-item">
            <div className="li-icon">🐔</div>
            <div className="li-num">{current.livestock.poultry}</div>
            <div className="li-label">Poultry</div>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Farm Profile</h2>
          </div>
          <ul className="partner-list">
            <li>
              <div>
                <div className="pname">Primary Crops</div>
                <div className="ploc">Grown this Kharif season</div>
              </div>
              <span className="track-val">{current.crops.join(', ')}</span>
            </li>
            <li>
              <div>
                <div className="pname">Farming Model</div>
                <div className="ploc">Land utilization</div>
              </div>
              <span className="track-val">Mixed Crop & Livestock</span>
            </li>
            <li>
              <div>
                <div className="pname">Land Area</div>
                <div className="ploc">Total holding size</div>
              </div>
              <span className="track-val">{current.landHolding}</span>
            </li>
            <li>
              <div>
                <div className="pname">Water Resource</div>
                <div className="ploc">Irrigation source</div>
              </div>
              <span className="track-val">Bore well & Rain-fed</span>
            </li>
            <li>
              <div>
                <div className="pname">Preferred Language</div>
                <div className="ploc">Telecalling preference</div>
              </div>
              <span className="track-val">Odia (Evening calls)</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Recent Orders</h2>
            <span className="link">{farmerOrders.length} {farmerOrders.length === 1 ? 'order' : 'orders'}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {farmerOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '20px 0' }}>
                      No orders on file for this phone number yet.
                    </td>
                  </tr>
                ) : farmerOrders.slice(0, 6).map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.order_number}</td>
                    <td>
                      {o.items[0]?.product_name ?? '—'}
                      {o.items.length > 1 && ` +${o.items.length - 1} more`}
                    </td>
                    <td>{rupees(o.total)}</td>
                    <td>{shortDate(o.created_at)}</td>
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
