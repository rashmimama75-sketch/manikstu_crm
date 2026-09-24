import React from 'react';
import { TODAY } from '../../data/managerDashboard';
import { MONTH, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, ExportTable, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import { TcSharedProps, fmtDuration, productName, stageName, verticalName } from './tcData';

interface Report {
  name: string;
  desc: string;
  count: number;
  build: () => Omit<ExportTable, 'filename'>;
}

export default function TcReportsView({ me, leads, followups, activities, sales, onToast }: TcSharedProps & { onToast: (m: string) => void }) {
  const leadName = (id: number | null) => (id === null ? '' : leads.find(l => l.id === id)?.customer_name ?? '');
  const monthCalls = activities.filter(a => a.created_at.startsWith(MONTH));
  const monthSales = sales.filter(s => s.sold_at.startsWith(MONTH));
  const subtitle = (n: number, what: string) => `${me.name} · ${n} ${what} · exported ${shortDate(TODAY)}`;

  const reports: Report[] = [
    {
      name: 'Call log',
      desc: 'Every call this month: time, lead, outcome, duration and note.',
      count: monthCalls.length,
      build: () => ({
        title: 'Call log · this month',
        subtitle: subtitle(monthCalls.length, 'calls'),
        columns: [
          { header: 'Time', width: 15 }, { header: 'Lead', width: 20 }, { header: 'Outcome', width: 12 },
          { header: 'Duration', width: 10 }, { header: 'Stage', width: 14 }, { header: 'Note', width: 36 },
        ],
        rows: [...monthCalls].reverse().map(a => [
          shortDateTime(a.created_at), leadName(a.lead_id), a.outcome, fmtDuration(a.duration_sec), a.stage_id ? stageName(a.stage_id) : '', a.note,
        ]),
      }),
    },
    {
      name: 'Sales',
      desc: 'Sales recorded this month, with product, quantity and amount.',
      count: monthSales.length,
      build: () => ({
        title: 'Sales · this month',
        subtitle: subtitle(monthSales.length, 'sales'),
        columns: [
          { header: 'Date', width: 10 }, { header: 'Customer', width: 22 }, { header: 'Product', width: 26 },
          { header: 'Qty', width: 6 }, { header: 'Amount', width: 12, money: true },
        ],
        rows: [...monthSales].sort((a, b) => b.sold_at.localeCompare(a.sold_at)).map(s => [
          shortDate(s.sold_at), s.customer_name, productName(s.product_id), s.quantity, s.amount,
        ]),
      }),
    },
    {
      name: 'Follow-ups',
      desc: 'All follow-ups with due date, reason and status (done, missed or pending).',
      count: followups.length,
      build: () => ({
        title: 'Follow-ups',
        subtitle: subtitle(followups.length, 'follow-ups'),
        columns: [
          { header: 'Due', width: 15 }, { header: 'Lead', width: 20 }, { header: 'Reason', width: 28 },
          { header: 'Status', width: 10 }, { header: 'Completed', width: 15 },
        ],
        rows: [...followups].sort((a, b) => b.due_at.localeCompare(a.due_at)).map(f => [
          shortDateTime(f.due_at), leadName(f.lead_id), f.note, f.status, f.completed_at ? shortDateTime(f.completed_at) : '',
        ]),
      }),
    },
    {
      name: 'My leads',
      desc: 'All leads assigned to you, with product, stage and source.',
      count: leads.length,
      build: () => ({
        title: 'My leads',
        subtitle: subtitle(leads.length, 'leads'),
        columns: [
          { header: 'Lead', width: 20 }, { header: 'Phone', width: 13 }, { header: 'Product', width: 20 },
          { header: 'Stage', width: 14 }, { header: 'Source', width: 13 }, { header: 'Added', width: 10 }, { header: 'Last touched', width: 15 },
        ],
        rows: leads.map(l => [
          l.customer_name, l.phone, verticalName(l.vertical_id), stageName(l.stage_id), l.source, shortDate(l.created_at), shortDateTime(l.updated_at),
        ]),
      }),
    },
  ];

  const run = async (r: Report, format: ExportFormat) => {
    if (r.count === 0) { onToast(`Nothing to export in ${r.name}`); return; }
    try {
      await exportTable(format, { filename: `${r.name.toLowerCase().replace(/\s+/g, '-')}-${TODAY}`, ...r.build() });
      onToast(`${r.name} exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  return (
    <div className="report-grid">
      {reports.map(r => (
        <div key={r.name} className="report-card">
          <h3>{r.name}</h3>
          <div className="rdesc">{r.desc}</div>
          <div className="rmeta">
            <ExportMenu onExport={format => run(r, format)} />
            <span className="rgen">{r.count} rows</span>
          </div>
        </div>
      ))}
    </div>
  );
}
