import React from 'react';
import { Clock, type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  /** What the page will do once it's ready. */
  planned: string[];
}

/** Placeholder for a section that isn't live yet. */
export default function ComingSoonView({ icon: Icon, title, description, planned }: Props) {
  return (
    <div className="panel coming-soon">
      <span className="coming-soon-icon"><Icon size={30} /></span>
      <span className="chip transit coming-soon-chip"><Clock size={12} /> Coming soon</span>
      <h2>{title}</h2>
      <p className="coming-soon-desc">{description}</p>
      <ul className="coming-soon-list">
        {planned.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
