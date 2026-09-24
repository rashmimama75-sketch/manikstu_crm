import React from 'react';
import { Phone } from 'lucide-react';

const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

export function TargetRing({ done, target }: { done: number; target: number }) {
  const pct = Math.min(1, target ? done / target : 0);
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r="50" />
        <circle
          className="ring-fill"
          cx="60"
          cy="60"
          r="50"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct)}
        />
      </svg>
      <div className="ring-label">
        <div className="rnum">{Math.round(pct * 100)}%</div>
        <div className="rden">{done} / {target}</div>
      </div>
    </div>
  );
}

export function CallButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="call-btn" onClick={onClick}>
      <Phone size={12} /> Call
    </button>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="filters">
      {options.map(opt => (
        <button
          key={opt}
          className={`filter-chip ${value === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const CHIP_CLASS: Record<string, string> = {
  Connected: 'delivered',
  'No answer': 'transit',
  Busy: 'pending',
  Pending: 'pending',
  'Due today': 'transit',
  Overdue: 'pending',
  Upcoming: 'confirmed',
  Completed: 'delivered',
  Open: 'pending',
  'In progress': 'transit',
  Resolved: 'delivered',
};

export function StatusChip({ status }: { status: string }) {
  return <span className={`chip ${CHIP_CLASS[status] ?? 'transit'}`}>{status}</span>;
}

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>{text}</td>
    </tr>
  );
}
