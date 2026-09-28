import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface RegionOption {
  value: string;
  label: string;
  /** Group heading shown above this option (e.g. the state). */
  group?: string;
  indent?: boolean;
}

interface Props {
  value: string;
  options: RegionOption[];
  onChange: (value: string) => void;
  label?: string;
  /** Unique id prefix when there is more than one dropdown on the page. */
  id?: string;
}

/**
 * Region picker whose list always opens downward from the field (a native <select> list is
 * placed by the browser and can open upward). Scrolls inside when the list is long.
 */
export default function RegionDropdown({ value, options, onChange, label = 'Region', id = 'region-dd' }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Keep the highlighted option in view while using the keyboard
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openList = () => { setActive(selectedIndex); setOpen(true); };
  const choose = (i: number) => { onChange(options[i].value); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(options.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="region-dd" ref={ref}>
      <span className="region-dd-label" id={`${id}-label`}>{label}</span>
      <button
        type="button"
        className={`region-dd-field ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="region-dd-value">{selected?.label ?? 'All regions'}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <ul className="region-dd-list" role="listbox" aria-labelledby={`${id}-label`} ref={listRef}>
          {options.map((o, i) => (
            <React.Fragment key={o.value}>
              {o.group && <li className="region-dd-group" role="presentation">{o.group}</li>}
              <li
                role="option"
                aria-selected={o.value === value}
                data-index={i}
                className={`region-dd-option ${o.indent ? 'indent' : ''} ${i === active ? 'active' : ''} ${o.value === value ? 'selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(i)}
              >
                <span>{o.label}</span>
                {o.value === value && <Check size={14} />}
              </li>
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
