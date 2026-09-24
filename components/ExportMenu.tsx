import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import type { ExportFormat } from '../lib/export';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => Promise<void>;
  label?: string;
  small?: boolean;
}

/** "Export ▾" button with Excel and PDF options. */
export default function ExportMenu({ onExport, label = 'Export', small = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const run = async (format: ExportFormat) => {
    setOpen(false);
    setBusy(true);
    try {
      await onExport(format);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="export-menu" ref={ref}>
      <button
        className={`btn-secondary ${small ? 'btn-small' : ''}`}
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? 'Preparing…' : label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="export-options" role="menu">
          <button role="menuitem" onClick={() => run('excel')}>
            <FileSpreadsheet size={16} /> Excel (.xlsx)
          </button>
          <button role="menuitem" onClick={() => run('pdf')}>
            <FileText size={16} /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
