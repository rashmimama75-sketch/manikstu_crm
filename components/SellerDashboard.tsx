'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, Boxes, LayoutDashboard, MapPin, ShoppingCart, Truck, Wallet } from 'lucide-react';
import Sidebar, { NavGroup } from './Sidebar';
import Topbar from './Topbar';
import FooterFrieze from './FooterFrieze';
import Modal from './Modal';
import NotificationsDrawer from './NotificationsDrawer';
import { LOW_STOCK_LEVEL } from '../data/stockLevels';
import SellerOverview from './seller/SellerOverview';
import SellerOrders from './seller/SellerOrders';
import SellerStock, { StockMovement } from './seller/SellerStock';
import SellerTracking from './seller/SellerTracking';
import SellerRegional from './seller/SellerRegional';
import SellerPayouts from './seller/SellerPayouts';
import SellerReports from './seller/SellerReports';
import type { CatalogProduct } from '../data/catalogProducts';
import type { OrderStatus, SalesOrder } from '../data/managerDashboard';
import type { Seller } from '../data/sellers';
import { nowStamp } from '../lib/format';
import { ManualStageAction, ORDER_STATUS_LABEL, ShipmentDetails, nextManualStep, sellerOrders, sellerTrackingFor } from './seller/sellerData';
import type { SessionUser } from '../lib/session';

interface Props {
  user: SessionUser;
  seller: Seller;
  /** Only this seller's orders, cut down to their items (see app/seller/page.tsx). */
  initialOrders: SalesOrder[];
  initialProducts: CatalogProduct[];
  /** Orders that also contain other sellers' items. */
  mixedOrderIds: number[];
}

export default function SellerDashboard({ user, seller, initialOrders, initialProducts, mixedOrderIds }: Props) {
  const [activePage, setActivePage] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sample data, kept in this page for now: changes reset on refresh until the backend has sellers.
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(initialProducts);

  const myProducts = useMemo(() => catalog.filter(p => seller.productIds.includes(p.id)), [catalog, seller]);
  const myOrders = useMemo(() => sellerOrders(orders, seller, catalog), [orders, seller, catalog]);

  // Notifications: things that need the seller's attention, newest concern first.
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const notifications = useMemo(() => {
    const list: { id: string; title: string; message: string; time: string; type: 'warning' | 'success' | 'info' }[] = [];
    const toConfirm = myOrders.filter(o => o.order.status === 'pending');
    const toShip = myOrders.filter(o => o.order.status === 'confirmed');
    const outOfStock = myProducts.filter(p => p.is_active && p.stock_quantity === 0);
    const lowStock = myProducts.filter(p => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_LEVEL);
    const dueAmount = myOrders.filter(o => o.payout === 'Due').reduce((s, o) => s + o.net, 0);

    if (toConfirm.length) list.push({ id: 'confirm', type: 'warning', title: `${toConfirm.length} order${toConfirm.length > 1 ? 's' : ''} to confirm`, message: 'New website orders are waiting for you to confirm them.', time: 'Now' });
    if (toShip.length) list.push({ id: 'ship', type: 'info', title: `${toShip.length} order${toShip.length > 1 ? 's' : ''} to pack & ship`, message: 'Confirmed orders are ready to be packed and dispatched.', time: 'Now' });
    if (outOfStock.length) list.push({ id: 'oos', type: 'warning', title: `${outOfStock.length} product${outOfStock.length > 1 ? 's' : ''} out of stock`, message: `${outOfStock.map(p => p.name).slice(0, 3).join(', ')}${outOfStock.length > 3 ? '…' : ''} — restock to keep selling.`, time: 'Today' });
    if (lowStock.length) list.push({ id: 'low', type: 'info', title: `${lowStock.length} product${lowStock.length > 1 ? 's' : ''} low on stock`, message: `Running low: ${lowStock.map(p => p.name).slice(0, 3).join(', ')}${lowStock.length > 3 ? '…' : ''}.`, time: 'Today' });
    if (dueAmount > 0) list.push({ id: 'payout', type: 'success', title: 'Payout due', message: `₹${dueAmount.toLocaleString('en-IN')} from delivered orders is due for payout.`, time: 'This week' });

    return list.filter(n => !dismissedNotifs.includes(n.id));
  }, [myOrders, myProducts, dismissedNotifs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const advanceOrder = (orderId: number, to: OrderStatus) => {
    const at = nowStamp();
    const order = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: to, status_history: [...o.status_history, { status: to, at }] } : o)));
    if (order) showToast(`${order.order_number} marked ${ORDER_STATUS_LABEL[to].toLowerCase()}`);
    // Once shipped or delivered, the seller's next job is tracking the delivery, so take them
    // straight there and filter to this order — a fresh shipment isn't "late" yet, so it sorts
    // near the bottom of the default list and would otherwise be invisible without this.
    if (to === 'shipped' || to === 'delivered') {
      setActivePage('tracking');
      setSearchQuery(order?.order_number ?? '');
      window.scrollTo(0, 0);
    }
  };

  // Confirm order: the seller types in an order/reference no. and a tracking no. by hand.
  // Once saved, the row switches from "Confirm" to "View" (this same card, read/editable).
  const [shipmentDetails, setShipmentDetails] = useState<Record<number, ShipmentDetails>>({});
  const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null);
  const [confirmOrderNo, setConfirmOrderNo] = useState('');
  const [confirmTrackingNo, setConfirmTrackingNo] = useState('');
  const confirmOrder = orders.find(o => o.id === confirmOrderId) ?? null;

  const openConfirmCard = (orderId: number) => {
    const existing = shipmentDetails[orderId];
    setConfirmOrderId(orderId);
    setConfirmOrderNo(existing?.orderNo ?? '');
    setConfirmTrackingNo(existing?.trackingNo ?? '');
  };
  const closeConfirmCard = () => setConfirmOrderId(null);

  const saveConfirmCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmOrderId === null || !confirmOrderNo.trim() || !confirmTrackingNo.trim()) return;
    const isFirstTime = confirmOrder?.status === 'pending';
    setShipmentDetails(prev => ({
      ...prev,
      [confirmOrderId]: {
        ...prev[confirmOrderId],
        orderNo: confirmOrderNo.trim(),
        trackingNo: confirmTrackingNo.trim(),
        confirmedAt: prev[confirmOrderId]?.confirmedAt ?? nowStamp(),
      },
    }));
    if (isFirstTime) {
      advanceOrder(confirmOrderId, 'confirmed');
    } else {
      showToast(`${confirmOrder?.order_number} tracking details updated`);
    }
    closeConfirmCard();
  };

  /** The seller clicking Mark packed / shipped / out for delivery / delivered, wherever that button lives. */
  const advanceManualStage = (orderId: number, action: ManualStageAction) => {
    if (action === 'shipped' || action === 'delivered') {
      advanceOrder(orderId, action);
      return;
    }
    const order = orders.find(o => o.id === orderId);
    const field = action === 'packed' ? 'packedAt' : 'outForDeliveryAt';
    setShipmentDetails(prev => {
      const existing = prev[orderId];
      if (!existing) return prev;
      return { ...prev, [orderId]: { ...existing, [field]: nowStamp() } };
    });
    if (order) showToast(`${order.order_number} marked ${action === 'packed' ? 'packed' : 'out for delivery'}`);
    setActivePage('tracking');
    setSearchQuery(order?.order_number ?? '');
    window.scrollTo(0, 0);
  };

  // Restock (Stock page): adds units and records the movement
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [restocking, setRestocking] = useState<CatalogProduct | null>(null);
  const [restockUnits, setRestockUnits] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const openRestock = (p: CatalogProduct, suggested: number) => {
    setRestocking(p);
    setRestockUnits(String(suggested > 0 ? suggested : 10));
    setRestockNote('');
  };
  const saveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restocking) return;
    const units = Math.round(Number(restockUnits));
    if (!(units > 0)) return;
    setCatalog(prev => prev.map(p => (p.id === restocking.id ? { ...p, stock_quantity: p.stock_quantity + units } : p)));
    setMovements(prev => [...prev, { id: prev.length + 1, productId: restocking.id, units, note: restockNote.trim(), at: nowStamp() }]);
    setRestocking(null);
    showToast(`${restocking.name}: +${units} units added to stock`);
  };

  // Matches what the Orders page shows: new orders still waiting to be confirmed.
  const toConfirm = myOrders.filter(o => o.order.status === 'pending').length;
  const toShip = myOrders.filter(o => o.order.status === 'confirmed').length;
  const lowStock = myProducts.filter(p => p.is_active && p.stock_quantity <= 20).length;
  const due = myOrders.filter(o => o.payout === 'Due').length;
  const lateShipments = useMemo(
    () => myOrders.filter(o => sellerTrackingFor(o.order, shipmentDetails[o.order.id]).delayed).length,
    [myOrders, shipmentDetails],
  );

  const pageMeta: Record<string, { title: string; sub: string }> = {
    overview: { title: 'Seller Dashboard', sub: `Your sales on Manikstu, ${user.name.split(' ')[0]}: orders to ship, stock and earnings.` },
    orders:   { title: 'Orders',           sub: 'New orders waiting to be confirmed. Once confirmed, follow them in Tracking.' },
    stock:    { title: 'Stock',            sub: 'What you have, what is promised to customers, how long it lasts and what to restock.' },
    tracking: { title: 'Tracking',         sub: 'Where each of your orders is: courier, tracking number, expected delivery and history.' },
    regional: { title: 'Regional Report',  sub: 'Where your products sell: orders and customers by state, district, town and PIN code.' },
    payouts:  { title: 'Payouts',          sub: 'What you earn from each order after Manikstu commission, and when it is paid.' },
    reports:  { title: 'Reports',          sub: 'Your orders, payouts and stock, exportable to Excel or PDF.' },
  };
  const currentMeta = pageMeta[activePage] ?? pageMeta.overview;

  const navGroups: NavGroup[] = [
    { label: 'Overview', items: [{ key: 'overview', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Sell',
      items: [
        { key: 'orders', label: 'Orders', icon: ShoppingCart, count: toConfirm },
        { key: 'stock', label: 'Stock', icon: Boxes },
        { key: 'tracking', label: 'Tracking', icon: Truck, count: lateShipments + toShip },
        { key: 'regional', label: 'Regional report', icon: MapPin },
      ],
    },
    {
      label: 'Money',
      items: [
        { key: 'payouts', label: 'Payouts', icon: Wallet, count: due },
        { key: 'reports', label: 'Reports', icon: BarChart3 },
      ],
    },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  return (
    <div className="card-layout">
      {toastMessage && <div className="toast">✅ {toastMessage}</div>}

      <div className="shell">
        <Sidebar groups={navGroups} activePage={activePage} onSelectPage={handleNavigate} />

        <main className="main">
          <Topbar
            title={currentMeta.title}
            subtitle={currentMeta.sub}
            search={activePage === 'orders' || activePage === 'stock' || activePage === 'tracking'
              ? {
                  query: searchQuery,
                  onChange: setSearchQuery,
                  placeholder: activePage === 'stock' ? 'Search products…' : activePage === 'tracking' ? 'Search order, customer, city, AWB…' : 'Search order, customer, city, product…',
                }
              : undefined}
            notifications={{ count: notifications.length, onToggle: () => setIsNotifsOpen(o => !o), title: 'Seller alerts' }}
            profile={{ name: user.name, role: seller.business, initials: user.initials, detail: `Seller ID ${user.staffId} · ${seller.city}` }}
          />

          {activePage === 'overview' && (
            <SellerOverview
              orders={myOrders}
              products={myProducts}
              onNavigate={handleNavigate}
              shipmentDetails={shipmentDetails}
              onAdvanceStage={advanceManualStage}
              onOpenConfirm={openConfirmCard}
            />
          )}
          {activePage === 'orders' && (
            <SellerOrders
              orders={myOrders}
              mixedOrderIds={mixedOrderIds}
              searchQuery={searchQuery}
              onOpenConfirm={openConfirmCard}
            />
          )}
          {activePage === 'stock' && <SellerStock products={myProducts} orders={myOrders} movements={movements} searchQuery={searchQuery} onRestock={openRestock} />}
          {activePage === 'tracking' && (
            <SellerTracking
              orders={myOrders}
              searchQuery={searchQuery}
              shipmentDetails={shipmentDetails}
              onAdvanceStage={advanceManualStage}
              onOpenConfirm={openConfirmCard}
            />
          )}
          {activePage === 'regional' && <SellerRegional seller={seller} orders={myOrders} onToast={showToast} />}
          {activePage === 'payouts' && <SellerPayouts orders={myOrders} seller={seller} />}
          {activePage === 'reports' && <SellerReports seller={seller} orders={myOrders} products={myProducts} onToast={showToast} />}
          <footer className="site-footer">
            <div>© 2026 Manikstu Agri Network · Seller Hub</div>
          </footer>
          <FooterFrieze />
        </main>
      </div>

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onClearAll={() => setDismissedNotifs(notifications.map(n => n.id))}
        title="Seller alerts"
      />

      <Modal
        isOpen={confirmOrder !== null}
        onClose={closeConfirmCard}
        title={confirmOrder ? `${confirmOrder.status === 'pending' ? 'Confirm order' : 'Order details'} · ${confirmOrder.order_number}` : ''}
        closeOnBackdrop={false}
      >
        {confirmOrder && (
          <form onSubmit={saveConfirmCard}>
            <p className="loc" style={{ marginBottom: 14 }}>
              {confirmOrder.status === 'pending'
                ? 'Add your order reference and courier tracking number to confirm this order.'
                : 'Your saved order reference and tracking number for this order.'}
            </p>
            <div className="form-group">
              <label htmlFor="sc-order-no">Order No.</label>
              <input
                id="sc-order-no"
                type="text"
                required
                placeholder="Your reference / invoice number"
                value={confirmOrderNo}
                onChange={e => setConfirmOrderNo(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sc-tracking-no">Tracking No.</label>
              <input
                id="sc-tracking-no"
                type="text"
                required
                placeholder="Courier tracking / AWB number"
                value={confirmTrackingNo}
                onChange={e => setConfirmTrackingNo(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeConfirmCard}>Cancel</button>
              {(() => {
                const step = nextManualStep(confirmOrder, shipmentDetails[confirmOrder.id]);
                return step && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { advanceManualStage(confirmOrder.id, step.action); closeConfirmCard(); }}
                  >
                    {step.label}
                  </button>
                );
              })()}
              <button type="submit" className="btn-primary">{confirmOrder.status === 'pending' ? 'Confirm order' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={restocking !== null} onClose={() => setRestocking(null)} title={`Restock · ${restocking?.name ?? ''}`} closeOnBackdrop={false}>
        {restocking && (
          <form onSubmit={saveRestock}>
            <p className="loc" style={{ marginBottom: 14 }}>
              In stock now: <strong>{restocking.stock_quantity}</strong> units ({restocking.size}). The units you add are counted straight away.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rs-units">Units received</label>
                <input id="rs-units" type="number" min={1} step={1} required value={restockUnits} onChange={e => setRestockUnits(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="rs-note">Batch / note (optional)</label>
                <input id="rs-note" type="text" placeholder="e.g. Batch 24-09, invoice 1182" value={restockNote} onChange={e => setRestockNote(e.target.value)} />
              </div>
            </div>
            <div className="form-total">New stock: <strong>{restocking.stock_quantity + Math.max(0, Math.round(Number(restockUnits)) || 0)}</strong> units</div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setRestocking(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Add to stock</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
