import type { Metadata } from 'next';
import SellerDashboard from '../../components/SellerDashboard';
import { requireRole } from '../../lib/auth';
import { fetchSellerOrders } from '../../lib/sellerOrders';
import { Seller, sellerForUser } from '../../data/sellers';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';
import { SALES_ORDERS, SalesOrder } from '../../data/managerDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Seller Dashboard',
};

/**
 * Only what this seller may see, worked out here on the server: their products, and the
 * orders that include them, cut down to their own items. Other sellers' items, and the
 * rest of the business data, never reach the seller's browser.
 */
function sellerSlice(seller: Seller) {
  const products = CATALOG_PRODUCTS.filter(p => seller.productIds.includes(p.id));
  const names = new Set(products.map(p => p.name));
  const mixedOrderIds: number[] = [];
  const orders: SalesOrder[] = [];
  for (const o of SALES_ORDERS) {
    const items = o.items.filter(i => names.has(i.product_name));
    if (items.length === 0) continue;
    if (items.length < o.items.length) mixedOrderIds.push(o.id);
    orders.push({ ...o, items, total: items.reduce((s, i) => s + i.price * i.quantity, 0) });
  }
  return { products, orders, mixedOrderIds };
}

export default async function SellerPage() {
  const user = await requireRole('seller');
  const seller = sellerForUser(user);
  if (!seller) {
    return (
      <main className="login-main">
        <div className="login-card">
          <h1>No seller account</h1>
          <p className="login-sub">Your login is not linked to a seller. Please contact Manikstu.</p>
        </div>
      </main>
    );
  }
  const local = sellerSlice(seller);
  // Live orders from the CRM backend (incl. website orders) when wired; else sample data.
  const backend = await fetchSellerOrders();
  const orders = backend?.orders ?? local.orders;
  const mixedOrderIds = backend?.mixedOrderIds ?? local.mixedOrderIds;
  return <SellerDashboard user={user} seller={seller} initialOrders={orders} initialProducts={local.products} mixedOrderIds={mixedOrderIds} />;
}
