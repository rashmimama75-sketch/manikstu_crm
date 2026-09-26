'use client';

import React, { useState, useEffect, useMemo } from 'react';
import HeaderFrieze from './HeaderFrieze';
import FooterFrieze from './FooterFrieze';
import Masthead from './Masthead';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Modal from './Modal';
import NotificationsDrawer from './NotificationsDrawer';

// Views
import DashboardView from './views/DashboardView';
import OrdersView from './views/OrdersView';
import EnquiriesView from './views/EnquiriesView';
import CustomersView from './views/CustomersView';
import FarmerDetailsView from './views/FarmerDetailsView';
import ProductsView from './views/ProductsView';
import StaffOnboardingView from './views/StaffOnboardingView';
import FranchiseView from './views/FranchiseView';
import FpoView from './views/FpoView';
import InventoryView from './views/InventoryView';
import MonetaryView from './views/MonetaryView';
import ReportsView from './views/ReportsView';
import TelecallingOverviewView from './views/TelecallingOverviewView';
import TelecallingExecutivesView from './views/TelecallingExecutivesView';
import { TeamData, staffStats, teamAlerts } from './telecaller/tcData';

// Initial Data
import {
  INITIAL_CUSTOMERS,
  INITIAL_STAFF,
  INITIAL_FRANCHISES,
  INITIAL_FPOS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  Customer,
  StaffCard,
  Franchise,
  FPO,
  InventoryItem,
  Transaction
} from '../data/initialData';
import {
  SALES_ORDERS,
  TRACKER_PRODUCTS,
  WEB_ENQUIRIES,
  TRACKER_SALES,
  TELECALLERS,
  VERTICALS,
  STAGES,
  SalesOrder,
  PaymentMethod,
  OrderSource,
  TrackerLead,
  WebEnquiry,
} from '../data/managerDashboard';
import { CATALOG_PRODUCTS, CatalogProduct } from '../data/catalogProducts';
import { nowStamp } from '../lib/format';
import type { TrackerState } from '../lib/trackerOps';
import { useTracker } from '../lib/useTracker';
import SyncBadge from './SyncBadge';
import type { SessionUser } from '../lib/session';

const ORDER_PRODUCTS = TRACKER_PRODUCTS.filter(p => p.vertical_id === 1);
const ORDER_CITIES = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Balasore', 'Koraput', 'Rayagada', 'Bolangir', 'Keonjhar', 'Angul'];

export default function ManagerDashboard({ user, tracker }: { user: SessionUser; tracker: TrackerState }) {
  // Page Routing State
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentTerritory, setCurrentTerritory] = useState<string>('All Odisha');

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Set only when a global search is submitted, to seed the destination page's own search box
  const [searchSeed, setSearchSeed] = useState<{ page: string; query: string; token: number } | null>(null);

  // Data Stores
  // Website orders + telecaller sales, shared by the dashboard and the Orders page
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(SALES_ORDERS);
  // Telecalling leads and website enquiries, shared by the dashboard and the Enquiries page
  // Leads, calls and follow-ups are shared with the telecalling head and the calling executives
  // (kept in sync with the server), so Team overview shows their latest work automatically.
  const sync = useTracker(tracker);
  const trackerLeads = sync.data.leads;
  // Telecalling section (view-only): same tracker data the telecalling head works from
  const [selectedExecutive, setSelectedExecutive] = useState<number | null>(null);
  const telecallingData: TeamData = useMemo(
    () => ({ leads: sync.data.leads, followups: sync.data.followups, activities: sync.data.activities, sales: TRACKER_SALES }),
    [sync.data],
  );
  const telecallingAlerts = useMemo(
    () => teamAlerts(staffStats(telecallingData, 'today', 'all')).filter(a => a.level === 'critical').length,
    [telecallingData],
  );
  const [webEnquiries, setWebEnquiries] = useState<WebEnquiry[]>(WEB_ENQUIRIES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  // Website product catalogue, editable on the Products page
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>(CATALOG_PRODUCTS);
  const [staff, setStaff] = useState<StaffCard[]>(INITIAL_STAFF);
  const [franchises, setFranchises] = useState<Franchise[]>(INITIAL_FRANCHISES);
  const [fpos, setFpos] = useState<FPO[]>(INITIAL_FPOS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Manager Notifications
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Low Inventory Alert', message: 'Cold-pressed mustard oil is at 9 units (Reorder level: 30).', time: '10 mins ago', type: 'warning' as const },
    { id: 'n2', title: 'Order MK-2458 Pending', message: 'Manoj Mallick payment pending confirmation.', time: '45 mins ago', type: 'info' as const },
    { id: 'n3', title: 'Franchise Payout Approved', message: 'Cuttack Hub payout of ₹42,000 processed.', time: '2 hours ago', type: 'success' as const }
  ]);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form States
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderCity, setNewOrderCity] = useState('Cuttack');
  const [newOrderProductId, setNewOrderProductId] = useState(ORDER_PRODUCTS[0].id);
  const [newOrderQty, setNewOrderQty] = useState('1');
  const [newOrderMethod, setNewOrderMethod] = useState<PaymentMethod>('COD');
  const [newOrderSource, setNewOrderSource] = useState<OrderSource>('telecaller');


  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Telecaller');
  const [newStaffLoc, setNewStaffLoc] = useState('Bhubaneswar');

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerLocation, setNewCustomerLocation] = useState('Cuttack');
  const [newCustomerLand, setNewCustomerLand] = useState('');

  const [newFranchiseName, setNewFranchiseName] = useState('Manikstu Agri Hub');
  const [newFranchiseLocation, setNewFranchiseLocation] = useState('');
  const [newFranchiseOwner, setNewFranchiseOwner] = useState('');

  const [newFpoName, setNewFpoName] = useState('');
  const [newFpoLocation, setNewFpoLocation] = useState('');
  const [newFpoCrop, setNewFpoCrop] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Nav metadata
  const pageMeta: Record<string, { title: string; sub: string }> = {
    dashboard:       { title: "Manager Dashboard", sub: "Telecalling team, sales pipeline, website orders and enquiries at a glance." },
    orders:          { title: "Orders", sub: "Website and telecaller orders — confirm, ship, deliver and collect payment." },
    enquiries:       { title: "Website Enquiries", sub: "Messages from the website contact form — reply, convert sales enquiries to leads, archive." },
    'tc-overview':   { title: "Telecalling · Team Overview", sub: "The whole telecalling team: calls, leads, follow-ups, sales and who needs a look." },
    'tc-executives': { title: "Telecalling Executives", sub: "Every telecalling executive. Tap one to see their leads, calls, follow-ups and sales." },
    customers:       { title: "Farmer Network", sub: "Directory of farmers across Odisha with crop profiles and purchase history." },
    farmer:          { title: "Farmer Profile", sub: "Land holding, livestock breakdown, crops and past orders." },
    products:        { title: "Products", sub: "Website catalogue — stock, price, visibility and 30-day sales for every product." },
    staffonboarding: { title: "User Onboarding", sub: "Recruitment funnel for telecallers, warehouse personnel and hub managers." },
    franchise:       { title: "Franchise Hubs", sub: "Performance, sales volume and payout management across Manikstu Agri Hubs." },
    fpo:             { title: "FPO Collectives", sub: "Farmer Producer Organisations partnered with Manikstu." },
    inventory:       { title: "Central Inventory", sub: "Real-time stock audits across Bhubaneswar, Cuttack, Balasore & Berhampur." },
    monetary:        { title: "Monetary Section", sub: "Revenue ledgers, escrow holds, pending settlements and franchise payouts." },
    reports:         { title: "Reports & Analytics", sub: "Generate and export SLA, financial, telecalling and inventory reports." }
  };

  const currentMeta = pageMeta[activePage] || pageMeta.dashboard;

  // Select Customer Profile Trigger
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setActivePage('farmer');
  };

  // Global search: jump to whichever page actually has a match, and seed its own search box
  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;
    const ql = q.toLowerCase();
    const inCustomers = customers.some(c => [c.name, c.phone, c.location].some(v => v.toLowerCase().includes(ql)));
    const inOrders = salesOrders.some(o => [o.order_number, o.customer_name, o.phone, o.city].some(v => v.toLowerCase().includes(ql)));
    const inEnquiries = webEnquiries.some(e => [e.name, e.email, e.phone ?? ''].some(v => v.toLowerCase().includes(ql)));
    const inProducts = catalogProducts.some(p => [p.name, p.sku ?? '', p.size].some(v => v.toLowerCase().includes(ql)));

    const target = inCustomers ? 'customers' : inOrders ? 'orders' : inEnquiries ? 'enquiries' : inProducts ? 'products' : null;
    if (target) {
      setActivePage(target);
      setSearchSeed({ page: target, query: q, token: Date.now() });
      showToast(`Found "${q}" in ${pageMeta[target].title}`);
    } else {
      showToast(`No matches for "${q}" in customers, orders, enquiries or products`);
    }
  };

  // Move Staff Stage
  const handleMoveStaffStage = (staffId: string, direction: 'next' | 'prev') => {
    const stages: Array<StaffCard['stage']> = ['Applied', 'Documents', 'Training', 'Active'];
    setStaff(prev => prev.map(s => {
      if (s.id === staffId) {
        const currIdx = stages.indexOf(s.stage);
        const nextIdx = direction === 'next' ? Math.min(stages.length - 1, currIdx + 1) : Math.max(0, currIdx - 1);
        return { ...s, stage: stages[nextIdx] };
      }
      return s;
    }));
    showToast(`Staff member updated to next stage`);
  };

  // Create New Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCustomer.trim() || !newOrderPhone.trim()) return;
    const product = ORDER_PRODUCTS.find(p => p.id === newOrderProductId)!;
    const quantity = Math.max(1, Number(newOrderQty) || 1);
    const id = Math.max(...salesOrders.map(o => o.id)) + 1;
    const orderNumber = `${newOrderSource === 'website' ? 'MNK' : 'TC'}-${id}`;
    const placed = nowStamp();
    const newOrd: SalesOrder = {
      id,
      order_number: orderNumber,
      source: newOrderSource,
      caller_id: null,
      customer_name: newOrderCustomer.trim(),
      phone: newOrderPhone.trim(),
      address: '',
      city: newOrderCity,
      state: 'Odisha',
      pincode: '',
      items: [{ product_name: product.name, quantity, price: product.price }],
      total: product.price * quantity,
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: newOrderMethod,
      notes: 'Created by manager',
      created_at: placed,
      status_history: [{ status: 'pending', at: placed }],
    };
    setSalesOrders([newOrd, ...salesOrders]);
    setActiveModal(null);
    setNewOrderCustomer('');
    setNewOrderPhone('');
    setNewOrderQty('1');
    showToast(`Order ${orderNumber} created`);
  };

  // Website enquiry → telecalling lead in the first stage of the chosen vertical
  const handleConvertToLead = async (enquiry: WebEnquiry, verticalId: number, callerId: number) => {
    if (!enquiry.phone) return;
    try {
      const { createdIds } = await sync.run({
        type: 'add-lead',
        lead: { vertical_id: verticalId, assigned_to: callerId, customer_name: enquiry.name, phone: enquiry.phone, source: 'Website' },
      });
      const leadId = createdIds[0];
      setWebEnquiries(prev => prev.map(e => (e.id === enquiry.id ? { ...e, lead_id: leadId, status: e.status === 'new' ? 'read' : e.status } : e)));
      const caller = TELECALLERS.find(t => t.id === callerId)?.name;
      const vertical = VERTICALS.find(v => v.id === verticalId)?.name;
      showToast(`Lead #${leadId} created in ${vertical} and assigned to ${caller}`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  const handleReassignLead = async (leadId: number, callerId: number) => {
    try {
      const { message } = await sync.run({ type: 'assign', leadIds: [leadId], callerId });
      showToast(message);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  // Career enquiry → user onboarding pipeline
  const handleMoveToOnboarding = (enquiry: WebEnquiry) => {
    if (staff.some(s => s.name === enquiry.name)) {
      showToast(`${enquiry.name} is already in User onboarding`);
      return;
    }
    setStaff([...staff, { id: `S-${staff.length + 1}`, name: enquiry.name, role: 'Applicant · from website', location: '—', stage: 'Applied' }]);
    showToast(`${enquiry.name} added to User onboarding`);
  };

  // Add Staff Member
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    const newS: StaffCard = {
      id: `S-${staff.length + 1}`,
      name: newStaffName,
      role: `${newStaffRole} · ${newStaffLoc}`,
      location: newStaffLoc,
      stage: 'Applied'
    };
    setStaff([...staff, newS]);
    setActiveModal(null);
    setNewStaffName('');
    showToast(`Staff candidate ${newS.name} added to pipeline`);
  };

  // Add Farmer / Customer Profile
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;
    const id = `C-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id,
      name: newCustomerName.trim(),
      location: newCustomerLocation,
      ordersCount: 0,
      lifetimeValue: 0,
      lastOrder: '—',
      status: 'New',
      phone: newCustomerPhone.trim(),
      landHolding: newCustomerLand.trim() || '—',
      crops: [],
      livestock: { cows: 0, buffaloes: 0, goats: 0, sheep: 0, poultry: 0 },
    };
    setCustomers([newCust, ...customers]);
    setActiveModal(null);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerLand('');
    showToast(`Farmer profile for ${newCust.name} added`);
  };

  // Add Franchise Hub
  const handleAddFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFranchiseLocation.trim() || !newFranchiseOwner.trim()) return;
    const newFr: Franchise = {
      id: `FR-${franchises.length + 1}`,
      name: newFranchiseName.trim() || 'Manikstu Agri Hub',
      location: newFranchiseLocation.trim(),
      owner: newFranchiseOwner.trim(),
      ordersThisMonth: 0,
      revenue: '—',
      status: 'Onboarding',
    };
    setFranchises([...franchises, newFr]);
    setActiveModal(null);
    setNewFranchiseLocation('');
    setNewFranchiseOwner('');
    showToast(`Franchise hub in ${newFr.location} added to onboarding`);
  };

  // Partner New FPO
  const handleAddFpo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFpoName.trim() || !newFpoLocation.trim()) return;
    const newFpo: FPO = {
      id: `FPO-${fpos.length + 1}`,
      name: newFpoName.trim(),
      location: newFpoLocation.trim(),
      members: 0,
      primaryCrop: newFpoCrop.trim() || '—',
      status: 'Onboarding',
    };
    setFpos([...fpos, newFpo]);
    setActiveModal(null);
    setNewFpoName('');
    setNewFpoLocation('');
    setNewFpoCrop('');
    showToast(`${newFpo.name} added as a partner FPO`);
  };

  // Reorder Item
  const handleTriggerReorder = (itemId: string) => {
    setInventory(prev => prev.map(inv => inv.id === itemId ? { ...inv, stock: inv.stock + 50, status: 'OK' } : inv));
    showToast(`Reorder PO generated. Restocked item!`);
  };

  // Approve Transaction
  const handleApproveTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'Settled' } : t));
    showToast(`Transaction ${txId} approved & settled`);
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'var(--forest)',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          zIndex: 2000,
          fontWeight: 600,
          fontSize: 13.5
        }}>
          ✅ {toastMessage}
        </div>
      )}

      {/* Masthead + Warli band: stay at the top while the page scrolls */}
      <div className="app-header">
      <Masthead
        currentTerritory={currentTerritory}
        onTerritoryChange={(terr) => {
          setCurrentTerritory(terr);
          showToast(`Territory switched to: ${terr}`);
        }}
        userName={user.name}
        userInitials={user.initials}
        onOpenProfile={() => setActiveModal('profile')}
      />

      {/* Header Frieze */}
      <HeaderFrieze />
      </div>

      {/* Main Shell */}
      <div className="shell">
        <Sidebar
          activePage={activePage}
          onSelectPage={page => { setActivePage(page); if (page === 'tc-executives') setSelectedExecutive(null); }}
          counts={{
            orders: salesOrders.filter(o => o.status === 'pending').length,
            enquiries: webEnquiries.filter(e => e.status === 'new').length,
            staff: staff.filter(s => s.stage === 'Applied').length,
            telecalling: telecallingAlerts
          }}
        />

        <main className="main">
          <Topbar
            title={currentMeta.title}
            subtitle={currentMeta.sub}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            unreadNotifsCount={notifications.length}
            onToggleNotifs={() => setIsNotifsOpen(!isNotifsOpen)}
            onQuickAction={() => setActiveModal('quickAction')}
            status={<SyncBadge syncedAt={sync.syncedAt} offline={sync.offline} />}
          />

          {/* PAGE ROUTING */}
          {activePage === 'dashboard' && (
            <DashboardView
              orders={salesOrders}
              leads={trackerLeads}
              followups={sync.data.followups}
              activities={sync.data.activities}
              onReassignLead={handleReassignLead}
              enquiries={webEnquiries}
              onEnquiriesChange={setWebEnquiries}
              onNavigate={setActivePage}
              onToast={showToast}
            />
          )}

          {activePage === 'orders' && (
            <OrdersView
              key={searchSeed?.page === 'orders' ? searchSeed.token : 'orders'}
              orders={salesOrders}
              onOrdersChange={setSalesOrders}
              onOpenNewOrderModal={() => setActiveModal('newOrder')}
              onToast={showToast}
              initialQuery={searchSeed?.page === 'orders' ? searchSeed.query : undefined}
            />
          )}

          {activePage === 'enquiries' && (
            <EnquiriesView
              key={searchSeed?.page === 'enquiries' ? searchSeed.token : 'enquiries'}
              enquiries={webEnquiries}
              onEnquiriesChange={setWebEnquiries}
              leads={trackerLeads}
              orders={salesOrders}
              onConvertToLead={handleConvertToLead}
              onMoveToOnboarding={handleMoveToOnboarding}
              onToast={showToast}
              initialQuery={searchSeed?.page === 'enquiries' ? searchSeed.query : undefined}
            />
          )}

          {activePage === 'tc-overview' && (
            <TelecallingOverviewView
              data={telecallingData}
              onOpenExecutive={id => { setSelectedExecutive(id); setActivePage('tc-executives'); window.scrollTo(0, 0); }}
              onToast={showToast}
            />
          )}

          {activePage === 'tc-executives' && (
            <TelecallingExecutivesView
              data={telecallingData}
              selectedId={selectedExecutive}
              onSelect={id => { setSelectedExecutive(id); window.scrollTo(0, 0); }}
              searchQuery=""
              onToast={showToast}
            />
          )}

          {activePage === 'customers' && (
            <CustomersView
              key={searchSeed?.page === 'customers' ? searchSeed.token : 'customers'}
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
              onOpenAddCustomerModal={() => setActiveModal('addCustomer')}
              initialQuery={searchSeed?.page === 'customers' ? searchSeed.query : undefined}
            />
          )}

          {activePage === 'farmer' && (
            <FarmerDetailsView
              customer={selectedCustomer}
              orders={salesOrders}
              onBack={() => setActivePage('customers')}
            />
          )}

          {activePage === 'products' && (
            <ProductsView
              key={searchSeed?.page === 'products' ? searchSeed.token : 'products'}
              products={catalogProducts}
              onProductsChange={setCatalogProducts}
              orders={salesOrders}
              onToast={showToast}
              initialQuery={searchSeed?.page === 'products' ? searchSeed.query : undefined}
            />
          )}

          {activePage === 'staffonboarding' && (
            <StaffOnboardingView
              staff={staff}
              onOpenAddStaffModal={() => setActiveModal('addStaff')}
              onMoveStage={handleMoveStaffStage}
            />
          )}

          {activePage === 'franchise' && (
            <FranchiseView
              franchises={franchises}
              onOpenAddFranchiseModal={() => setActiveModal('addFranchise')}
            />
          )}

          {activePage === 'fpo' && (
            <FpoView
              fpos={fpos}
              onOpenAddFpoModal={() => setActiveModal('addFpo')}
            />
          )}

          {activePage === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onTriggerReorder={handleTriggerReorder}
            />
          )}

          {activePage === 'monetary' && (
            <MonetaryView
              transactions={transactions}
              onApproveTransaction={handleApproveTransaction}
            />
          )}

          {activePage === 'reports' && (
            <ReportsView
              salesOrders={salesOrders}
              trackerLeads={trackerLeads}
              followups={sync.data.followups}
              activities={sync.data.activities}
              staff={staff}
              franchises={franchises}
              fpos={fpos}
              inventory={inventory}
              transactions={transactions}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div>© 2026 Manikstu Agri Network · Territory Operations Manager</div>
      </footer>

      {/* Footer Frieze */}
      <FooterFrieze />

      {/* Manager Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
      />

      {/* MODALS */}
      {/* 1. New Order Modal */}
      <Modal
        isOpen={activeModal === 'newOrder'}
        onClose={() => setActiveModal(null)}
        title="Create New Order"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label>Customer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Nayak"
              value={newOrderCustomer}
              onChange={(e) => setNewOrderCustomer(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={newOrderPhone}
                onChange={(e) => setNewOrderPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>City / District</label>
              <select value={newOrderCity} onChange={(e) => setNewOrderCity(e.target.value)}>
                {ORDER_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Product</label>
              <select value={newOrderProductId} onChange={(e) => setNewOrderProductId(Number(e.target.value))}>
                {ORDER_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} · ₹{p.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min={1} value={newOrderQty} onChange={(e) => setNewOrderQty(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Payment method</label>
              <select value={newOrderMethod} onChange={(e) => setNewOrderMethod(e.target.value as PaymentMethod)}>
                <option value="COD">Cash on delivery</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Net banking">Net banking</option>
              </select>
            </div>
            <div className="form-group">
              <label>Source</label>
              <select value={newOrderSource} onChange={(e) => setNewOrderSource(e.target.value as OrderSource)}>
                <option value="telecaller">Phone / telecaller</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>
          <div className="form-total">
            Total: <strong>₹{((ORDER_PRODUCTS.find(p => p.id === newOrderProductId)?.price ?? 0) * Math.max(1, Number(newOrderQty) || 1)).toLocaleString('en-IN')}</strong>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Order</button>
          </div>
        </form>
      </Modal>


      {/* 3. Add Staff Modal */}
      <Modal
        isOpen={activeModal === 'addStaff'}
        onClose={() => setActiveModal(null)}
        title="Recruit Staff Candidate"
      >
        <form onSubmit={handleAddStaff}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              placeholder="Candidate Name"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Target Role</label>
            <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)}>
              <option value="Telecaller">Telecaller Executive</option>
              <option value="Franchise Associate">Franchise Associate</option>
              <option value="Warehouse Staff">Warehouse Specialist</option>
              <option value="Hub Manager">Agri Hub Manager</option>
            </select>
          </div>
          <div className="form-group">
            <label>Location Hub</label>
            <input
              type="text"
              value={newStaffLoc}
              onChange={(e) => setNewStaffLoc(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Candidate</button>
          </div>
        </form>
      </Modal>

      {/* Add Farmer Profile Modal */}
      <Modal
        isOpen={activeModal === 'addCustomer'}
        onClose={() => setActiveModal(null)}
        title="Add Farmer Profile"
      >
        <form onSubmit={handleAddCustomer}>
          <div className="form-group">
            <label>Farmer Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Nayak"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Location / District</label>
              <select value={newCustomerLocation} onChange={(e) => setNewCustomerLocation(e.target.value)}>
                {ORDER_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Land Holding (optional)</label>
            <input
              type="text"
              placeholder="e.g. 3.5 acres"
              value={newCustomerLand}
              onChange={(e) => setNewCustomerLand(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Farmer</button>
          </div>
        </form>
      </Modal>

      {/* Add Franchise Hub Modal */}
      <Modal
        isOpen={activeModal === 'addFranchise'}
        onClose={() => setActiveModal(null)}
        title="Add Franchise Hub"
      >
        <form onSubmit={handleAddFranchise}>
          <div className="form-group">
            <label>Hub Name</label>
            <input
              type="text"
              required
              value={newFranchiseName}
              onChange={(e) => setNewFranchiseName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>District Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Sambalpur"
                value={newFranchiseLocation}
                onChange={(e) => setNewFranchiseLocation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Franchise Partner</label>
              <input
                type="text"
                required
                placeholder="Owner name"
                value={newFranchiseOwner}
                onChange={(e) => setNewFranchiseOwner(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Add Franchise Hub</button>
          </div>
        </form>
      </Modal>

      {/* Partner New FPO Modal */}
      <Modal
        isOpen={activeModal === 'addFpo'}
        onClose={() => setActiveModal(null)}
        title="Partner New FPO"
      >
        <form onSubmit={handleAddFpo}>
          <div className="form-group">
            <label>FPO Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Koraput Farmers' Producer Org."
              value={newFpoName}
              onChange={(e) => setNewFpoName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>District / Location</label>
              <input
                type="text"
                required
                value={newFpoLocation}
                onChange={(e) => setNewFpoLocation(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Harvest Crop</label>
              <input
                type="text"
                placeholder="e.g. Paddy"
                value={newFpoCrop}
                onChange={(e) => setNewFpoCrop(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Partner FPO</button>
          </div>
        </form>
      </Modal>

      {/* 4. Manager Quick Action Modal */}
      <Modal
        isOpen={activeModal === 'quickAction'}
        onClose={() => setActiveModal(null)}
        title="Manager Control Center"
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <button
            className="btn-secondary"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => {
              setActiveModal(null);
              setActivePage('orders');
              showToast('Opened Orders for Manager Escrow Approval');
            }}
          >
            📋 Approve Pending Order Escrows
          </button>
          <button
            className="btn-secondary"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => {
              setActiveModal(null);
              setActivePage('inventory');
              showToast('Opened Inventory Audits');
            }}
          >
            📦 Trigger Warehouse Stock Re-balance
          </button>
          <button
            className="btn-secondary"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => {
              setActiveModal(null);
              setActivePage('monetary');
              showToast('Opened Monetary Section');
            }}
          >
            💳 Release Franchise Monthly Payouts
          </button>
        </div>
      </Modal>

      {/* 5. Manager Profile Modal */}
      <Modal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        title="Manager Profile"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 12px' }}>{user.initials}</div>
          <h2 style={{ fontSize: 20 }}>{user.name}</h2>
          <div style={{ color: 'var(--leaf)', fontWeight: 600, fontSize: 13, marginTop: 4 }}>
            Territory Operations Manager
          </div>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12.5, marginTop: 2 }}>
            Central Odisha Region · Bhubaneswar HQ
          </div>

          <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 16, textAlign: 'left', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Employee ID:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{user.staffId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Assigned Territory:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{currentTerritory}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Approval Limit:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>₹5,00,000 / tx</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
