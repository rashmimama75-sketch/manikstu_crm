import React from 'react';
import { TC_REPORTS } from '../../data/telecallerData';

export default function TcReportsView({ onGenerate }: { onGenerate: (name: string) => void }) {
  return (
    <div className="report-grid">
      {TC_REPORTS.map(r => (
        <div key={r.name} className="report-card">
          <h3>{r.name}</h3>
          <div className="rdesc">{r.desc}</div>
          <div className="rmeta">
            <button className="btn-secondary" onClick={() => onGenerate(r.name)}>Generate</button>
            <span className="rgen">Last: {r.last}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
