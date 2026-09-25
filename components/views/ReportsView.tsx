import React from 'react';
import {
  TODAY,
  TELECALLERS,
  LEAD_ACTIVITIES,
  FOLLOWUPS,
  TRACKER_SALES,
  TrackerLead,
  SalesOrder,
} from '../../data/managerDashboard';
import { StaffCard, Franchise, FPO, InventoryItem, Transaction } from '../../data/initialData';
import { MONTH, daysBefore, shortDate, shortDateTime } from '../../lib/format';
import { exportTable } from '../../lib/export';

interface ReportsViewProps {
  salesOrders: SalesOrder[];
  trackerLeads: TrackerLead[];
  staff: StaffCard[];
  franchises: Franchise[];
  fpos: FPO[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  onToast: (message: string) => void;
}

export default function ReportsView({
  salesOrders,
  trackerLeads,
  staff,
  franchises,
  fpos,
  inventory,
  transactions,
  onToast,
}: ReportsViewProps) {
  const run = async (label: string, build: () => Promise<void> | void) => {
    try {
      await build();
      onToast(`Generated ${label} report (PDF)`);
    } catch {
      onToast(`Couldn't generate the ${label} report. Please try again.`);
    }
  };

  const telecallerPerformance = () => {
    const salesMonth = TRACKER_SALES.filter(s => s.sold_at.startsWith(MONTH));
    const rows = TELECALLERS.map(t => {
      const mine = trackerLeads.filter(l => l.assigned_to === t.id);
      const fu = FOLLOWUPS.filter(f => f.caller_id === t.id && f.due_at.startsWith(MONTH));
      const sales = salesMonth.filter(s => s.caller_id === t.id);
      const calls = LEAD_ACTIVITIES.filter(a => a.caller_id === t.id && a.created_at.startsWith(MONTH));
      return [
        t.name, t.region, t.is_active ? 'Active' : 'Inactive', mine.length, calls.length,
        fu.filter(f => f.status === 'done').length, fu.filter(f => f.status === 'missed').length,
        sales.length, sales.reduce((a, s) => a + s.amount, 0),
      ];
    });
    return exportTable('pdf', {
      filename: `telecaller-performance-${TODAY}`,
      title: 'Telecaller Performance',
      subtitle: `${MONTH} · ${rows.length} telecallers · exported ${shortDate(TODAY)}`,
      columns: [
        { header: 'Telecaller', width: 20 }, { header: 'Region', width: 14 }, { header: 'Status', width: 10 },
        { header: 'Assigned leads', width: 12 }, { header: 'Calls', width: 10 },
        { header: 'Follow-ups done', width: 12 }, { header: 'Follow-ups missed', width: 12 },
        { header: 'Sales', width: 10 }, { header: 'Revenue', width: 12, money: true },
      ],
      rows,
    });
  };

  const orderSlaReport = () => {
    const month = salesOrders.filter(o => o.created_at.startsWith(MONTH));
    return exportTable('pdf', {
      filename: `order-delivery-sla-${TODAY}`,
      title: 'Order & Delivery SLAs',
      subtitle: `${MONTH} · ${month.length} orders · exported ${shortDate(TODAY)}`,
      columns: [
        { header: 'Order', width: 12 }, { header: 'Placed', width: 15 }, { header: 'Source', width: 11 },
        { header: 'Status', width: 11 }, { header: 'Age (days)', width: 10 }, { header: 'Payment', width: 10 },
        { header: 'Total', width: 11, money: true },
      ],
      rows: month.map(o => [
        o.order_number, shortDateTime(o.created_at), o.source === 'website' ? 'Website' : 'Telecaller',
        o.status, daysBefore(o.created_at), o.payment_status, o.total,
      ]),
    });
  };

  const franchiseFpoRevenue = () => exportTable('pdf', {
    filename: `franchise-fpo-revenue-${TODAY}`,
    title: 'Franchise & FPO Revenue',
    subtitle: `${franchises.length} franchise hubs · ${fpos.length} FPOs · exported ${shortDate(TODAY)}`,
    columns: [
      { header: 'Type', width: 11 }, { header: 'Name', width: 30 }, { header: 'Location', width: 16 },
      { header: 'Partner / Members', width: 20 }, { header: 'Orders / Crop', width: 16 }, { header: 'Revenue', width: 12 },
      { header: 'Status', width: 12 },
    ],
    rows: [
      ...franchises.map(f => ['Franchise', f.name, f.location, f.owner, String(f.ordersThisMonth), f.revenue, f.status]),
      ...fpos.map(f => ['FPO', f.name, f.location, `${f.members} members`, f.primaryCrop, '—', f.status]),
    ],
  });

  const inventoryMovement = () => exportTable('pdf', {
    filename: `inventory-movement-${TODAY}`,
    title: 'Inventory Movement',
    subtitle: `${inventory.length} SKUs across all warehouses · exported ${shortDate(TODAY)}`,
    columns: [
      { header: 'Product', width: 26 }, { header: 'Category', width: 16 }, { header: 'Warehouse', width: 13 },
      { header: 'Stock', width: 9 }, { header: 'Reorder level', width: 10 }, { header: 'Lead time', width: 10 },
      { header: 'Last restocked', width: 14 }, { header: 'Status', width: 11 },
    ],
    rows: inventory.map(i => [i.product, i.category, i.warehouse, i.stock, i.reorderLevel, i.leadTime, i.lastRestocked, i.status]),
  });

  const staffFunnel = () => {
    const stages: Array<StaffCard['stage']> = ['Applied', 'Documents', 'Training', 'Active'];
    return exportTable('pdf', {
      filename: `staff-onboarding-funnel-${TODAY}`,
      title: 'Staff & Training Funnel',
      subtitle: `${staff.length} candidates in the pipeline · exported ${shortDate(TODAY)}`,
      columns: [
        { header: 'Name', width: 22 }, { header: 'Role', width: 30 }, { header: 'Location', width: 16 }, { header: 'Stage', width: 12 },
      ],
      rows: stages.flatMap(stage => staff.filter(s => s.stage === stage).map(s => [s.name, s.role, s.location, s.stage])),
    });
  };

  const financialAudit = () => exportTable('pdf', {
    filename: `financial-ledger-audit-${TODAY}`,
    title: 'Financial & Ledger Audit',
    subtitle: `${transactions.length} ledger entries · exported ${shortDate(TODAY)}`,
    columns: [
      { header: 'Transaction', width: 13 }, { header: 'Type', width: 18 }, { header: 'Party', width: 26 },
      { header: 'Amount', width: 12, money: true }, { header: 'Status', width: 11 }, { header: 'Date', width: 16 },
    ],
    rows: transactions.map(t => [t.id, t.type, t.party, t.amount, t.status, t.date]),
  });

  const reports = [
    { name: 'Telecaller Performance', desc: 'Calls made, conversion rate, follow-up SLA adherence.', build: telecallerPerformance },
    { name: 'Order & Delivery SLAs', desc: 'Fulfilment time, delivery SLA breaches, cancellations.', build: orderSlaReport },
    { name: 'Franchise & FPO Revenue', desc: 'Revenue by partner hub, growth trend, onboarding pipeline.', build: franchiseFpoRevenue },
    { name: 'Inventory Movement', desc: 'Stock movement, reorder alerts, warehouse comparison.', build: inventoryMovement },
    { name: 'Staff & Training Funnel', desc: 'Onboarding funnel, training completion by module.', build: staffFunnel },
    { name: 'Financial & Ledger Audit', desc: 'Revenue, settlements and payouts across the Odisha network.', build: financialAudit },
  ];

  return (
    <div className="report-grid">
      {reports.map((r) => (
        <div key={r.name} className="report-card">
          <h3>{r.name}</h3>
          <div className="rdesc">{r.desc}</div>
          <div className="rmeta">
            <button className="btn-secondary" onClick={() => run(r.name, r.build)}>
              Generate PDF
            </button>
            <span className="rgen">Generated from live dashboard data</span>
          </div>
        </div>
      ))}
    </div>
  );
}
