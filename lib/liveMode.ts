import { SALES_ORDERS, WEB_ENQUIRIES } from '../data/managerDashboard';
import { INITIAL_COMPLAINTS } from '../data/complaints';
import { SAMPLE_CAMPAIGNS } from '../data/marketing';
import { INITIAL_CUSTOMERS, INITIAL_FPOS, INITIAL_FRANCHISES, INITIAL_TRANSACTIONS } from '../data/initialData';
import { INITIAL_STOCK } from '../data/centralInventory';

/**
 * Live mode: the dashboards are connected to the CRM backend, so they must show what is really in it
 * (including nothing, on a fresh install) and never the made-up sample data that powers the offline demo.
 *
 * Several pages start from these sample lists directly, so they are emptied in place: every module that
 * imported one sees the change. Without a backend nothing is touched and the offline demo works as before.
 */
export function emptySampleData(): void {
  for (const list of [
    SALES_ORDERS, WEB_ENQUIRIES, INITIAL_COMPLAINTS, SAMPLE_CAMPAIGNS,
    INITIAL_CUSTOMERS, INITIAL_FRANCHISES, INITIAL_FPOS, INITIAL_TRANSACTIONS, INITIAL_STOCK,
  ] as unknown[][]) {
    list.length = 0;
  }
}
