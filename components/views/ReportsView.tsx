import React from 'react';

interface ReportsViewProps {
  onGenerateReport: (reportName: string) => void;
}

export default function ReportsView({ onGenerateReport }: ReportsViewProps) {
  const reports = [
    { name: 'Telecaller Performance', desc: 'Calls made, conversion rate, follow-up SLA adherence.', last: 'Last generated: Today' },
    { name: 'Order & Delivery SLAs', desc: 'Fulfilment time, delivery SLA breaches, cancellations.', last: 'Last generated: Today' },
    { name: 'Franchise & FPO Revenue', desc: 'Revenue by partner hub, growth trend, onboarding pipeline.', last: 'Last generated: Yesterday' },
    { name: 'Inventory Movement', desc: 'Stock movement, reorder alerts, warehouse comparison.', last: 'Last generated: Yesterday' },
    { name: 'Staff & Training Funnel', desc: 'Onboarding funnel, training completion by module.', last: 'Last generated: 3 days ago' },
    { name: 'Financial & Ledger Audit', desc: 'Revenue, settlements and payouts across the Odisha network.', last: 'Last generated: Today' }
  ];

  return (
    <div className="report-grid">
      {reports.map((r, idx) => (
        <div key={idx} className="report-card">
          <h3>{r.name}</h3>
          <div className="rdesc">{r.desc}</div>
          <div className="rmeta">
            <button className="btn-secondary" onClick={() => onGenerateReport(r.name)}>
              Generate PDF
            </button>
            <span className="rgen">{r.last}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
