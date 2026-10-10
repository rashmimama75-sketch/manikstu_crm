import React from 'react';

export interface HBarRow {
  key: string;
  label: string;
  value: number;
  display: string;
  tip: string;
}

/** Horizontal bar list: one series, value labels at the end, hover tooltip per bar. `wide` is for a full-width panel: names get a compact column so the bars use the space. */
export default function HBarList({ rows, wide = false }: { rows: HBarRow[]; wide?: boolean }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <ul className={`hbar-list${wide ? ' wide' : ''}`}>
      {rows.map(r => (
        <li key={r.key} className="hbar-row" data-tip={r.tip}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hbar-value">{r.display}</span>
        </li>
      ))}
    </ul>
  );
}
