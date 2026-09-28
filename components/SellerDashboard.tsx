'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Search, Sun } from 'lucide-react';
import HeaderFrieze from './HeaderFrieze';
import FooterFrieze from './FooterFrieze';
import LogoutButton from './LogoutButton';
import Modal from './Modal';
import SellerOverview from './seller/SellerOverview';
import SellerOrders from './seller/SellerOrders';
import SellerProducts from './seller/SellerProducts';
import SellerTracking from './seller/SellerTracking';
import SellerPayouts from './seller/SellerPayouts';
import SellerReports from './seller/SellerReports';
import type { CatalogProduct } from '../data/catalogProducts';
import type { OrderStatus, SalesOrder } from '../data/managerDashboard';
import type { Seller } from '../data/sellers';
import { nowStamp } from '../lib/format';
import { ORDER_STATUS_LABEL, sellerOrders } from './seller/sellerData';
import { trackingFor } from './telecaller/orderTracking';
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sample data, kept in this page for now: changes reset on refresh until the backend has sellers.
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(initialProducts);

  const myProducts = useMemo(() => catalog.filter(p => seller.productIds.includes(p.id)), [catalog, seller]);
  const myOrders = useMemo(() => sellerOrders(orders, seller, catalog), [orders, seller, catalog]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const advanceOrder = (orderId: number, to: OrderStatus) => {
    const at = nowStamp();
    const order = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: to, status_history: [...o.status_history, { status: to, at }] } : o)));
    if (order) showToast(`${order.order_number} marked ${ORDER_STATUS_LABEL[to].toLowerCase()}`);
  };

  // Edit product
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editActive, setEditActive] = useState(true);
  const openEdit = (p: CatalogProduct) => {
    setEditing(p);
    setEditPrice(p.price === null ? '' : String(p.price));
    setEditStock(String(p.stock_quantity));
    setEditActive(p.is_active);
  };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const price = editPrice.trim() === '' ? null : Math.max(0, Math.round(Number(editPrice)));
    const stock = Math.max(0, Math.round(Number(editStock) || 0));
    setCatalog(prev => prev.map(p => (p.id === editing.id ? { ...p, price, stock_quantity: stock, is_active: editActive } : p)));
    setEditing(null);
    showToast(`${editing.name} updated`);
  };

  const toShip = myOrders.filter(o => o.order.status === 'pending' || o.order.status === 'confirmed').length;
  const lowStock = myProducts.filter(p => p.is_active && p.stock_quantity <= 20).length;
  const due = myOrders.filter(o => o.payout === 'Due').length;
  const lateShipments = useMemo(() => myOrders.filter(o => trackingFor(o.order).delayed).length, [myOrders]);

  const pageMeta: Record<string, { title: string; sub: string }> = {
    overview: { title: 'Seller Dashboard', sub: `Your sales on Manikstu, ${user.name.split(' ')[0]}: orders to ship, stock and earnings.` },
    orders:   { title: 'Orders',           sub: 'Orders that include your products. Confirm new ones, then mark them shipped.' },
    products: { title: 'My Products',      sub: 'Your listings on the Manikstu website: price, stock and whether they are shown.' },
    tracking: { title: 'Tracking',         sub: 'Where each of your orders is: courier, tracking number, expected delivery and history.' },
    payouts:  { title: 'Payouts',          sub: 'What you earn from each order after Manikstu commission, and when it is paid.' },
    reports:  { title: 'Reports',          sub: 'Your orders, payouts and stock, exportable to Excel or PDF.' },
  };
  const currentMeta = pageMeta[activePage] ?? pageMeta.overview;

  const navGroups = [
    { label: 'Overview', items: [{ key: 'overview', label: 'Dashboard' }] },
    {
      label: 'Sell',
      items: [
        { key: 'orders', label: 'Orders', count: toShip },
        { key: 'products', label: 'My products', count: lowStock },
        { key: 'tracking', label: 'Tracking', count: lateShipments },
      ],
    },
    {
      label: 'Money',
      items: [
        { key: 'payouts', label: 'Payouts', count: due },
        { key: 'reports', label: 'Reports' },
      ],
    },
  ];

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  return (
    <div>
      {toastMessage && <div className="toast">✅ {toastMessage}</div>}

      <div className="app-header">
        <div className="masthead">
          <div className="masthead-bar">
            <div className="brand">
              <div className="brand-mark">🌾</div>
              <div>
                <div className="brand-name">Manikstu Seller Hub</div>
                <div className="brand-tag">{seller.business}</div>
              </div>
            </div>
            <div className="masthead-right">
              <span>{seller.city}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Seller ID: {user.staffId}</span>

              <div className="masthead-user">
                <div className="who" style={{ cursor: 'default' }}>
                  <div className="avatar">{user.initials}</div>
                  <div>
                    <div className="who-name">{user.name}</div>
                    <div className="who-role">Seller</div>
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        <HeaderFrieze />
      </div>

      <div className="shell">
        <aside className="sidebar">
          {navGroups.map(group => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.key)}
                >
                  <span className="dot"></span>
                  {item.label}
                  {'count' in item && item.count !== undefined && item.count > 0 && (
                    <span className="count">{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <h1>{currentMeta.title}</h1>
              <div className="sub">{currentMeta.sub}</div>
            </div>
            <div className="topbar-tools">
              {(activePage === 'orders' || activePage === 'products' || activePage === 'tracking') && (
                <div className="search">
                  <Search size={16} style={{ color: 'var(--ink-soft)' }} />
                  <input
                    type="text"
                    placeholder={activePage === 'products' ? 'Search products…' : activePage === 'tracking' ? 'Search order, customer, city, AWB…' : 'Search order, customer, city, product…'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              <button
                className="icon-btn"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>

          {activePage === 'overview' && (
            <SellerOverview orders={myOrders} products={myProducts} onNavigate={handleNavigate} onAdvance={advanceOrder} />
          )}
          {activePage === 'orders' && <SellerOrders orders={myOrders} mixedOrderIds={mixedOrderIds} searchQuery={searchQuery} onAdvance={advanceOrder} />}
          {activePage === 'products' && <SellerProducts products={myProducts} orders={myOrders} searchQuery={searchQuery} onEdit={openEdit} />}
          {activePage === 'tracking' && <SellerTracking orders={myOrders} searchQuery={searchQuery} />}
          {activePage === 'payouts' && <SellerPayouts orders={myOrders} seller={seller} />}
          {activePage === 'reports' && <SellerReports seller={seller} orders={myOrders} products={myProducts} onToast={showToast} />}
        </main>
      </div>

      <footer className="site-footer">
        <div>© 2026 Manikstu Agri Network · Odisha</div>
      </footer>
      <FooterFrieze />

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={`Edit · ${editing?.name ?? ''}`} closeOnBackdrop={false}>
        {editing && (
          <form onSubmit={saveEdit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sp-price">Price (₹)</label>
                <input id="sp-price" type="number" min={0} step={1} placeholder="Not set" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="sp-stock">Stock (units)</label>
                <input id="sp-stock" type="number" min={0} step={1} required value={editStock} onChange={e => setEditStock(e.target.value)} />
              </div>
            </div>
            <label className="check-filter" style={{ marginBottom: 16, display: 'flex' }}>
              <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
              Show this product on the Manikstu website
            </label>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
