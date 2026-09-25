import React, { useState } from 'react';
import { InventoryItem } from '../../data/initialData';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onTriggerReorder: (itemId: string) => void;
}

export default function InventoryView({ inventory, onTriggerReorder }: InventoryViewProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All warehouses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All categories');

  const warehouses = ['All warehouses', 'Bhubaneswar', 'Cuttack', 'Balasore', 'Berhampur'];
  const categories = ['All categories', 'Seeds', 'Fertilizer & soil', 'Crop protection', 'Oils & produce', 'Equipment'];

  const filteredItems = inventory.filter((item) => {
    const matchW = selectedWarehouse === 'All warehouses' || item.warehouse === selectedWarehouse;
    const matchC = selectedCategory === 'All categories' || item.category === selectedCategory;
    return matchW && matchC;
  });

  const lowStockCount = inventory.filter(i => i.status === 'Low stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'Out of stock').length;
  const warehouseCount = new Set(inventory.map(i => i.warehouse)).size;
  const totalUnits = inventory.reduce((acc, curr) => acc + curr.stock, 0);

  const handleExportCSV = () => {
    const headers = ['ID', 'Product', 'Category', 'Warehouse', 'Stock', 'Unit', 'ReorderLevel', 'Status'];
    const rows = filteredItems.map(i => [
      i.id,
      `"${i.product}"`,
      i.category,
      i.warehouse,
      i.stock,
      i.unit,
      i.reorderLevel,
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manikstu_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{inventory.length}</div>
          <div className="label">SKUs Company-Wide</div>
        </div>
        <div className="score">
          <div className="num">{totalUnits.toLocaleString()}</div>
          <div className="label">Total Units on Hand</div>
        </div>
        <div className="score">
          <div className="num">{warehouseCount}</div>
          <div className="label">Regional Warehouses</div>
        </div>
        <div className="score">
          <div className="num">{lowStockCount}</div>
          <div className="label">Low Stock Alerts</div>
        </div>
        <div className="score">
          <div className="num">{outOfStockCount}</div>
          <div className="label">Out of Stock</div>
        </div>
      </div>

      <div className="page-toolbar" style={{ alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label className="select-label">Warehouse Hub</label>
            <select
              className="filter-select"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              {warehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="select-label">Product Category</label>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          ⬇ Export CSV Report
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Stock on Hand</h2>
          <span className="link">Showing {filteredItems.length} of {inventory.length} SKUs</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Warehouse Hub</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Lead Time</th>
                <th>Last Restocked</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((inv) => (
                <tr key={inv.id}>
                  <td className="cust">{inv.product}</td>
                  <td>{inv.category}</td>
                  <td>{inv.warehouse}</td>
                  <td style={{ fontWeight: 600 }}>{inv.stock} {inv.unit}</td>
                  <td>{inv.reorderLevel} {inv.unit}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{inv.leadTime}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{inv.lastRestocked}</td>
                  <td>
                    <span className={`chip ${inv.status === 'OK' ? 'delivered' : 'pending'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.status === 'Low stock' ? (
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => onTriggerReorder(inv.id)}
                      >
                        + Reorder
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Nominal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
