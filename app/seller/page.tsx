import type { Metadata } from 'next';
import SellerDashboard from '../../components/SellerDashboard';
import { requireRole } from '../../lib/auth';
import { fetchSellerOrders, fetchSellerProducts } from '../../lib/sellerOrders';
import { sellerForUser } from '../../data/sellers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manikstu Seller Dashboard',
};

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

  // Everything the seller sees comes from the CRM backend: their own catalogue
  // and the orders that contain their products (including website orders that
  // arrived through the integration endpoint). No sample data — the dashboard
  // starts empty until real products and orders exist.
  const [backend, products] = await Promise.all([fetchSellerOrders(), fetchSellerProducts()]);
  const orders = backend?.orders ?? [];
  const mixedOrderIds = backend?.mixedOrderIds ?? [];

  return (
    <SellerDashboard
      user={user}
      seller={seller}
      initialOrders={orders}
      initialProducts={products ?? []}
      mixedOrderIds={mixedOrderIds}
    />
  );
}
