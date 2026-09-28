import React from 'react';
import type { CatalogProduct } from '../../data/catalogProducts';
import { LOW_STOCK_LEVEL } from '../../data/stockLevels';
import { daysBefore, rupees } from '../../lib/format';
import { SellerOrder, counts } from './sellerData';

interface Props {
  products: CatalogProduct[];
  orders: SellerOrder[];
  searchQuery: string;
  onEdit: (product: CatalogProduct) => void;
}

export default function SellerProducts({ products, orders, searchQuery, onEdit }: Props) {
  const recent = orders.filter(o => counts(o) && daysBefore(o.order.created_at) < 30);
  const sold30 = (p: CatalogProduct) =>
    recent.reduce((s, o) => s + o.items.filter(i => i.product_name === p.name).reduce((n, i) => n + i.quantity, 0), 0);

  const q = searchQuery.trim().toLowerCase();
  const rows = products.filter(p => !q || [p.name, p.category, p.size].some(v => v.toLowerCase().includes(q)));
  const out = products.filter(p => p.is_active && p.stock_quantity === 0).length;
  const low = products.filter(p => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_LEVEL).length;

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{products.length}</div><div className="label">Products listed</div></div>
        <div className="score"><div className="num">{products.filter(p => p.is_active).length}</div><div className="label">Active on the website</div></div>
        <div className="score"><div className="num">{low}</div><div className="label">Low stock (≤ {LOW_STOCK_LEVEL})</div></div>
        <div className="score"><div className="num">{out}{out > 0 && <small className="warn">restock</small>}</div><div className="label">Out of stock</div></div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th className="num-col">Price</th><th className="num-col">Stock</th><th className="num-col">Sold · 30 days</th><th>Listing</th><th></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>No products match.</td></tr>
              )}
              {rows.map(p => (
                <tr key={p.id}>
                  <td className="cust">{p.name}<div className="loc">{p.size}{p.sku ? ` · SKU ${p.sku}` : ''}</div></td>
                  <td>{p.category}</td>
                  <td className="num-col">{p.price === null ? <span className="loc">Not set</span> : rupees(p.price)}</td>
                  <td className="num-col">
                    {p.stock_quantity}
                    {p.stock_quantity === 0 ? <div><span className="chip pending">Out of stock</span></div>
                      : p.stock_quantity <= LOW_STOCK_LEVEL ? <div><span className="chip transit">Low</span></div> : null}
                  </td>
                  <td className="num-col">{sold30(p)}</td>
                  <td><span className={`chip ${p.is_active ? 'delivered' : 'muted'}`}>{p.is_active ? 'Active' : 'Hidden'}</span></td>
                  <td><button className="btn-secondary btn-small" onClick={() => onEdit(p)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
