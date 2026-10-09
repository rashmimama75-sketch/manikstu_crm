'use client';

import type { Telecaller } from '../data/managerDashboard';
import { emptySampleData } from '../lib/liveMode';
import { applyTelecallers } from '../lib/telecallers';

/**
 * Puts the backend's real executives into the browser's copy of TELECALLERS, and (when the dashboards run against
 * the backend) clears the built-in sample data, before the dashboard next to it renders (siblings render in order),
 * so names, ids and lists line up on the first paint. It draws nothing.
 */
export default function TelecallersSync({ list, live = false }: { list: Telecaller[]; live?: boolean }) {
  if (live) emptySampleData();
  applyTelecallers(list);
  return null;
}
