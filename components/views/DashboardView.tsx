import React from 'react';
import { Order, Lead, StaffCard, Franchise, InventoryItem, Transaction } from '../../data/initialData';
import { ShieldAlert, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  leads: Lead[];
  staff: StaffCard[];
  franchises: Franchise[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  onNavigate: (page: string) => void;
  onTrackOrder: (orderId: string) => void;
}

export default function DashboardView({
  orders,
  leads,
  staff,
  franchises,
  inventory,
  onNavigate,
  onTrackOrder
}: DashboardViewProps) {
  const lowStockItems = inventory.filter(i => i.status === 'Low stock');
  const activeFranchises = franchises.filter(f => f.status === 'Active');

  const appliedStaff = staff.filter(s => s.stage === 'Applied').length;
  const docsStaff = staff.filter(s => s.stage === 'Documents').length;
  const trainingStaff = staff.filter(s => s.stage === 'Training').length;
  const activeStaff = staff.filter(s => s.stage === 'Active').length;

  return (
    <>
      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="score">
          <div className="num">
            {orders.length} <small>+12 today</small>
          </div>
          <div className="label">Total Orders</div>
        </div>
        <div className="score">
          <div className="num">34</div>
          <div className="label">Open Enquiries</div>
        </div>
        <div className="score">
          <div className="num">2,410</div>
          <div className="label">Active Farmers</div>
        </div>
        <div className="score">
          <div className="num">86</div>
          <div className="label">Products Listed</div>
        </div>
        <div className="score">
          <div className="num">{activeStaff}</div>
          <div className="label">Active Staff</div>
        </div>
        <div className="score">
          <div className="num">{activeFranchises.length}</div>
          <div className="label">Franchise Hubs</div>
        </div>
      </div>

      {/* Main Grid 1: Recent Orders + Telecaller Follow-ups */}
      <div className="grid cols-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Recent Orders</h2>
            <span className="link" onClick={() => onNavigate('orders')}>View all orders</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id}>
                    <td>{ord.id}</td>
                    <td className="cust">
                      {ord.customer}
                      <div className="loc">{ord.location}</div>
                    </td>
                    <td>{ord.product}</td>
                    <td>₹{ord.amount.toLocaleString()}</td>
                    <td>
                      <span className={`chip ${
                        ord.status === 'Delivered' ? 'delivered' :
                        ord.status === 'In transit' ? 'transit' :
                        ord.status === 'Confirmed' ? 'confirmed' : 'pending'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        title="Track Order"
                        onClick={() => onTrackOrder(ord.id)}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Telecaller Follow-ups</h2>
            <span className="link" onClick={() => onNavigate('enquiries')}>Telecalling Desk</span>
          </div>
          <ul className="lead-list">
            {leads.map((ld) => (
              <li key={ld.id}>
                <div>
                  <div className="name">{ld.name}</div>
                  <div className="action">{ld.action}</div>
                </div>
                <div className="when">{ld.when}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Grid 2: Staff Pipeline, Franchises & Inventory */}
      <div className="grid cols-3">
        <div className="panel">
          <div className="panel-head">
            <h2>Staff Onboarding</h2>
            <span className="link" onClick={() => onNavigate('staffonboarding')}>Pipeline</span>
          </div>
          <div className="pipeline">
            <div className="stage">
              <div className="dot2">{appliedStaff}</div>
              <div className="stage-label">Applied</div>
            </div>
            <div className="stage">
              <div className="dot2">{docsStaff}</div>
              <div className="stage-label">Documents</div>
            </div>
            <div className="stage">
              <div className="dot2">{trainingStaff}</div>
              <div className="stage-label">Training</div>
            </div>
            <div className="stage">
              <div className="dot2">{activeStaff}</div>
              <div className="stage-label">Active</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Franchise & FPO</h2>
            <span className="link" onClick={() => onNavigate('franchise')}>View Network</span>
          </div>
          <ul className="partner-list">
            {franchises.slice(0, 3).map((f) => (
              <li key={f.id}>
                <div>
                  <div className="pname">{f.name}</div>
                  <div className="ploc">{f.location} · Franchise</div>
                </div>
                <span className={`chip ${f.status === 'Active' ? 'delivered' : 'transit'}`}>
                  {f.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Central Inventory</h2>
            <span className="link" onClick={() => onNavigate('inventory')}>
              Low stock: {lowStockItems.length}
            </span>
          </div>
          <ul className="stock-list">
            {inventory.slice(0, 3).map((inv) => {
              const fillPct = Math.min(100, Math.round((inv.stock / inv.reorderLevel) * 50));
              return (
                <li key={inv.id}>
                  <div className="stock-row">
                    <span>{inv.product}</span>
                    <span className="qty">{inv.stock} {inv.unit} left</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${fillPct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main Grid 3: Monetary & Quick Reports */}
      <div className="grid cols-2">
        <div className="panel money">
          <div className="panel-head">
            <h2>Monetary Section</h2>
            <span className="link" onClick={() => onNavigate('monetary')}>Full Ledger</span>
          </div>
          <div className="money-grid">
            <div>
              <div className="m-num">₹18.6L</div>
              <div className="m-label">Revenue (Month)</div>
            </div>
            <div>
              <div className="m-num">₹2.1L</div>
              <div className="m-label">Pending Settlements</div>
            </div>
            <div>
              <div className="m-num">₹64K</div>
              <div className="m-label">Franchise Payouts</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Manager Reports</h2>
            <span className="link" onClick={() => onNavigate('reports')}>All Reports</span>
          </div>
          <div className="report-links">
            <div className="report-link" onClick={() => onNavigate('reports')}>
              Telecaller SLA
              <span className="sub">Calls, conversions</span>
            </div>
            <div className="report-link" onClick={() => onNavigate('reports')}>
              Fulfillment
              <span className="sub">Delivery status</span>
            </div>
            <div className="report-link" onClick={() => onNavigate('reports')}>
              Franchises
              <span className="sub">Sales, payouts</span>
            </div>
            <div className="report-link" onClick={() => onNavigate('reports')}>
              Stock Levels
              <span className="sub">Warehouse audits</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
