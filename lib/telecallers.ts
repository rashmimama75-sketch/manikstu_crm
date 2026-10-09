import { TELECALLERS, type Telecaller } from '../data/managerDashboard';

/**
 * Swap the built-in sample executives for the real ones from the CRM backend.
 *
 * The dashboards look executives up in TELECALLERS (names, who a lead is assigned to, who may be assigned
 * to). The sample list has its own ids (11-16); the backend's staff have the ids of their user rows, so
 * without this a calling executive's own leads never match their id and the head's imports and assignments
 * name people the backend does not know. The array is replaced in place so every module that imported it
 * sees the change. An empty list (no backend, or it is unreachable) leaves the sample list alone.
 */
export function applyTelecallers(list: Telecaller[]): void {
  if (list.length === 0) return;
  TELECALLERS.splice(0, TELECALLERS.length, ...list);
}
