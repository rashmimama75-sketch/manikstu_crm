'use client';

import type { Telecaller, TrackerSale } from '../data/managerDashboard';
import { applySales, emptySampleData } from '../lib/liveMode';
import { applyTelecallers } from '../lib/telecallers';

/**
 * Puts the backend's real executives into the browser's copy of TELECALLERS, and (when the dashboards run against
 * the backend) clears the built-in sample data, before the dashboard next to it renders (siblings render in order),
 * so names, ids and lists line up on the first paint. It draws nothing.
 */
export default function TelecallersSync({ list, sales, live = false }: { list: Telecaller[]; sales?: TrackerSale[]; live?: boolean }) {
  if (live) {
    emptySampleData();
    applySales(sales ?? []); // the backend's real sales, not the sample ones
  }
  applyTelecallers(list);
  return null;
}
