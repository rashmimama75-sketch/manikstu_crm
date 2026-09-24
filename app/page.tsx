'use client';

import React, { useState, useEffect } from 'react';
import HeaderFrieze from '../components/HeaderFrieze';
import FooterFrieze from '../components/FooterFrieze';
import Masthead from '../components/Masthead';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import NotificationsDrawer from '../components/NotificationsDrawer';

// Views
import DashboardView from '../components/views/DashboardView';
import OrdersView from '../components/views/OrdersView';
import OrderTrackingView from '../components/views/OrderTrackingView';
import EnquiriesView from '../components/views/EnquiriesView';
import CustomersView from '../components/views/CustomersView';
import FarmerDetailsView from '../components/views/FarmerDetailsView';
import ProductsView from '../components/views/ProductsView';
import StaffOnboardingView from '../components/views/StaffOnboardingView';
import FranchiseView from '../components/views/FranchiseView';
import FpoView from '../components/views/FpoView';
import InventoryView from '../components/views/InventoryView';
import MonetaryView from '../components/views/MonetaryView';
import ReportsView from '../components/views/ReportsView';

// Initial Data
import {
  INITIAL_ORDERS,
  INITIAL_LEADS,
  INITIAL_ENQUIRIES,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_STAFF,
  INITIAL_FRANCHISES,
  INITIAL_FPOS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  Order,
  Enquiry,
  Customer,
  Product,
  StaffCard,
  Franchise,
  FPO,
  InventoryItem,
  Transaction
} from '../data/initialData';

export default function Home() {
  // Page Routing State
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('MK-2460');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentTerritory, setCurrentTerritory] = useState<string>('All Odisha');

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data Stores
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [leads] = useState(INITIAL_LEADS);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(INITIAL_ENQUIRIES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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
  const [newOrderProduct, setNewOrderProduct] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderLocation, setNewOrderLocation] = useState('Cuttack');

  const [newEnquiryName, setNewEnquiryName] = useState('');
  const [newEnquiryInterest, setNewEnquiryInterest] = useState('Drip irrigation setup');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Telecaller');
  const [newStaffLoc, setNewStaffLoc] = useState('Bhubaneswar');

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
    orders:          { title: "Order Fulfillment", sub: "Oversee order lifecycle from placement, payment verification to delivery." },
    tracking:        { title: "Shipment Tracking", sub: "Step-by-step courier timeline and escrow status." },
    enquiries:       { title: "Telecalling Desk", sub: "Incoming farmer inquiries routed to telecallers for conversion." },
    customers:       { title: "Farmer Network", sub: "Directory of farmers across Odisha with crop profiles and purchase history." },
    farmer:          { title: "Farmer Profile", sub: "Land holding, livestock breakdown, crops and past orders." },
    products:        { title: "Product Catalog", sub: "Seeds, fertilizers, equipment and organic produce available for dispatch." },
    staffonboarding: { title: "Staff Onboarding", sub: "Recruitment funnel for telecallers, warehouse personnel and hub managers." },
    franchise:       { title: "Franchise Hubs", sub: "Performance, sales volume and payout management across Maniksthu Agri Hubs." },
    fpo:             { title: "FPO Collectives", sub: "Farmer Producer Organisations partnered with Maniksthu." },
    inventory:       { title: "Central Inventory", sub: "Real-time stock audits across Bhubaneswar, Cuttack, Balasore & Berhampur." },
    monetary:        { title: "Monetary Section", sub: "Revenue ledgers, escrow holds, pending settlements and franchise payouts." },
    reports:         { title: "Reports & Analytics", sub: "Generate and export SLA, financial, telecalling and inventory reports." }
  };

  const currentMeta = pageMeta[activePage] || pageMeta.dashboard;

  // Track Order Trigger
  const handleTrackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActivePage('tracking');
  };

  // Select Customer Profile Trigger
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setActivePage('farmer');
  };

  // Advance Order Timeline
  const handleAdvanceTimeline = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStatus: Order['status'] = 'Delivered';
        if (o.status === 'Payment pending') nextStatus = 'Confirmed';
        else if (o.status === 'Confirmed') nextStatus = 'In transit';
        else if (o.status === 'In transit') nextStatus = 'Delivered';
        return { ...o, status: nextStatus, paymentStatus: 'Paid' };
      }
      return o;
    }));
    showToast(`Order ${orderId} status advanced!`);
  };

  // Update Order Status directly from table
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    showToast(`Order ${orderId} updated to ${status}`);
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
    if (!newOrderCustomer || !newOrderProduct) return;
    const newId = `MK-${Math.floor(2462 + Math.random() * 100)}`;
    const newOrd: Order = {
      id: newId,
      customer: newOrderCustomer,
      location: newOrderLocation,
      product: newOrderProduct,
      amount: Number(newOrderAmount) || 1200,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      date: 'Today'
    };
    setOrders([newOrd, ...orders]);
    setActiveModal(null);
    setNewOrderCustomer('');
    setNewOrderProduct('');
    setNewOrderAmount('');
    showToast(`New Order ${newId} created successfully!`);
  };

  // Create New Enquiry
  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiryName) return;
    const newEnq: Enquiry = {
      id: `ENQ-${Math.floor(342 + Math.random() * 50)}`,
      name: newEnquiryName,
      interestedIn: newEnquiryInterest,
      source: 'Direct Telecall',
      assignedTo: 'Ananya Mishra',
      status: 'New',
      received: 'Just now'
    };
    setEnquiries([newEnq, ...enquiries]);
    setActiveModal(null);
    setNewEnquiryName('');
    showToast(`Enquiry ${newEnq.id} assigned to team!`);
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

      {/* Masthead */}
      <Masthead
        currentTerritory={currentTerritory}
        onTerritoryChange={(terr) => {
          setCurrentTerritory(terr);
          showToast(`Territory switched to: ${terr}`);
        }}
      />

      {/* Header Frieze */}
      <HeaderFrieze />

      {/* Main Shell */}
      <div className="shell">
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          counts={{
            orders: orders.length,
            enquiries: enquiries.filter(e => e.status === 'New').length,
            staff: staff.filter(s => s.stage === 'Applied').length
          }}
        />

        <main className="main">
          <Topbar
            title={currentMeta.title}
            subtitle={currentMeta.sub}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            unreadNotifsCount={notifications.length}
            onToggleNotifs={() => setIsNotifsOpen(!isNotifsOpen)}
            onOpenProfile={() => setActiveModal('profile')}
            onQuickAction={() => setActiveModal('quickAction')}
          />

          {/* PAGE ROUTING */}
          {activePage === 'dashboard' && (
            <DashboardView
              onNavigate={setActivePage}
              onToast={showToast}
            />
          )}

          {activePage === 'orders' && (
            <OrdersView
              orders={orders}
              onTrackOrder={handleTrackOrder}
              onOpenNewOrderModal={() => setActiveModal('newOrder')}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activePage === 'tracking' && (
            <OrderTrackingView
              orderId={selectedOrderId}
              orders={orders}
              onBack={() => setActivePage('orders')}
              onAdvanceTimeline={handleAdvanceTimeline}
            />
          )}

          {activePage === 'enquiries' && (
            <EnquiriesView
              enquiries={enquiries}
              onOpenNewEnquiryModal={() => setActiveModal('newEnquiry')}
              onUpdateEnquiryStatus={(id, st) => {
                setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: st } : e));
                showToast(`Enquiry updated to ${st}`);
              }}
            />
          )}

          {activePage === 'customers' && (
            <CustomersView
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
              onOpenAddCustomerModal={() => setActiveModal('addCustomer')}
            />
          )}

          {activePage === 'farmer' && (
            <FarmerDetailsView
              customer={selectedCustomer}
              onBack={() => setActivePage('customers')}
            />
          )}

          {activePage === 'products' && (
            <ProductsView
              products={products}
              onOpenAddProductModal={() => setActiveModal('addProduct')}
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
              onGenerateReport={(name) => showToast(`Generated ${name} Report (PDF)!`)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div>© 2026 Maniksthu Agri Network · Territory Operations Manager</div>
        <div className="links">
          <span onClick={() => showToast('Manager Desk Support: +91 674 290182')}>Support Desk</span>
          <span onClick={() => showToast('SLA Manual loaded')}>SLA Guidelines</span>
          <span onClick={() => showToast('Privacy Compliance Active')}>District Data Policy</span>
        </div>
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
          <div className="form-group">
            <label>Location / District</label>
            <select value={newOrderLocation} onChange={(e) => setNewOrderLocation(e.target.value)}>
              <option value="Cuttack">Cuttack</option>
              <option value="Puri">Puri</option>
              <option value="Bhubaneswar">Bhubaneswar</option>
              <option value="Balasore">Balasore</option>
              <option value="Berhampur">Berhampur</option>
            </select>
          </div>
          <div className="form-group">
            <label>Product</label>
            <input
              type="text"
              required
              placeholder="e.g. Swarna Paddy Seed, 20kg"
              value={newOrderProduct}
              onChange={(e) => setNewOrderProduct(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              placeholder="2400"
              value={newOrderAmount}
              onChange={(e) => setNewOrderAmount(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Order</button>
          </div>
        </form>
      </Modal>

      {/* 2. New Enquiry Modal */}
      <Modal
        isOpen={activeModal === 'newEnquiry'}
        onClose={() => setActiveModal(null)}
        title="Record New Inquiry"
      >
        <form onSubmit={handleCreateEnquiry}>
          <div className="form-group">
            <label>Farmer Name</label>
            <input
              type="text"
              required
              placeholder="Farmer / Buyer Name"
              value={newEnquiryName}
              onChange={(e) => setNewEnquiryName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Interested Product / Solution</label>
            <input
              type="text"
              required
              value={newEnquiryInterest}
              onChange={(e) => setNewEnquiryInterest(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Assign Lead</button>
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
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 12px' }}>SN</div>
          <h2 style={{ fontSize: 20 }}>Smurti Nayak</h2>
          <div style={{ color: 'var(--leaf)', fontWeight: 600, fontSize: 13, marginTop: 4 }}>
            Territory Operations Manager
          </div>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12.5, marginTop: 2 }}>
            Central Odisha Region · Bhubaneswar HQ
          </div>

          <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 16, textAlign: 'left', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Employee ID:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>MNK-MGR-042</span>
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Assigned Territory:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{currentTerritory}</span>
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Approval Limit:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto' }}>₹5,00,000 / tx</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
