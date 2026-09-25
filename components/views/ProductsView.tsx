import React, { useMemo, useState } from 'react';
import { Check, LayoutGrid, List, Star, X } from 'lucide-react';
import { CatalogProduct, LOW_STOCK_LEVEL, PRODUCT_LOCALES, ProductCategory } from '../../data/catalogProducts';
import { TODAY, TRACKER_PRODUCTS, SalesOrder } from '../../data/managerDashboard';
import { daysBefore, rupees, rupeesShort, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';

interface ProductsViewProps {
  products: CatalogProduct[];
  onProductsChange: React.Dispatch<React.SetStateAction<CatalogProduct[]>>;
  orders: SalesOrder[];
  onToast: (message: string) => void;
  initialQuery?: string;
}

type StockState = 'in' | 'low' | 'out';
type Alert = 'out-visible' | 'low' | 'no-sales' | 'incomplete';

const stockState = (p: CatalogProduct): StockState =>
  p.stock_quantity <= 0 ? 'out' : p.stock_quantity <= LOW_STOCK_LEVEL ? 'low' : 'in';
const STOCK_LABEL: Record<StockState, string> = { in: 'In stock', low: 'Low stock', out: 'Out of stock' };
const STOCK_CHIP: Record<StockState, string> = { in: 'delivered', low: 'transit', out: 'pending' };

/** What's missing from a listing. SKU and shelf life are left out of the "incomplete" alert because every product lacks them today. */
const listingGaps = (p: CatalogProduct) => {
  const gaps: string[] = [];
  if (p.price === null) gaps.push('price');
  if (p.images.length === 0) gaps.push('photo');
  if (!p.long_description) gaps.push('description');
  const missing = PRODUCT_LOCALES.filter(l => !p.translations.includes(l.code));
  if (missing.length) gaps.push(`${missing.map(l => l.label).join(' & ')} translation`);
  return gaps;
};

const telecallerNames = new Set(TRACKER_PRODUCTS.map(p => p.name));

export default function ProductsView({ products, onProductsChange, orders, onToast, initialQuery }: ProductsViewProps) {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [stock, setStock] = useState<StockState | 'all'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [query, setQuery] = useState(initialQuery ?? '');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [priceDraft, setPriceDraft] = useState('');
  const [stockDraft, setStockDraft] = useState('');

  // Sales over the last 30 days, from website and telecaller orders (cancelled excluded)
  const sales = useMemo(() => {
    const byName = new Map<string, { units: number; revenue: number; daily: number[]; cities: Map<string, number> }>();
    for (const o of orders) {
      const age = daysBefore(o.created_at);
      if (o.status === 'cancelled' || age > 29) continue;
      for (const it of o.items) {
        const s = byName.get(it.product_name) ?? { units: 0, revenue: 0, daily: Array(30).fill(0), cities: new Map() };
        s.units += it.quantity;
        s.revenue += it.quantity * it.price;
        s.daily[29 - age] += it.quantity;
        s.cities.set(o.city, (s.cities.get(o.city) ?? 0) + it.quantity);
        byName.set(it.product_name, s);
      }
    }
    return byName;
  }, [orders]);
  const salesOf = (p: CatalogProduct) => sales.get(p.name) ?? { units: 0, revenue: 0, daily: Array(30).fill(0), cities: new Map<string, number>() };

  const ALERTS: Record<Alert, { label: string; test: (p: CatalogProduct) => boolean }> = {
    'out-visible': { label: 'out of stock but shown on website', test: p => p.is_active && stockState(p) === 'out' },
    low: { label: 'low stock', test: p => stockState(p) === 'low' },
    'no-sales': { label: 'no sales in 30 days', test: p => p.is_active && salesOf(p).units === 0 },
    incomplete: { label: 'incomplete listings', test: p => listingGaps(p).length > 0 },
  };

  // 1. Summary tiles
  const best = [...products].sort((a, b) => salesOf(b).units - salesOf(a).units)[0];
  const tiles = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    low: products.filter(p => stockState(p) === 'low').length,
    out: products.filter(p => stockState(p) === 'out').length,
    featured: products.filter(p => p.is_featured).length,
    incomplete: products.filter(p => listingGaps(p).length > 0).length,
    revenue: products.reduce((a, p) => a + salesOf(p).revenue, 0),
  };

  // 2–3. Filtering
  const q = query.trim().toLowerCase();
  const filtered = products
    .filter(p => {
      if (alert) return ALERTS[alert].test(p);
      if (category !== 'all' && p.category !== category) return false;
      if (status === 'active' && !p.is_active) return false;
      if (status === 'hidden' && p.is_active) return false;
      if (stock !== 'all' && stockState(p) !== stock) return false;
      if (featuredOnly && !p.is_featured) return false;
      if (q && ![p.name, p.sku ?? '', p.size].some(v => v.toLowerCase().includes(q))) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const notForTelecallers = products.filter(p => !telecallerNames.has(p.name));
  const open = products.find(p => p.id === openId) ?? null;

  // ---- Updates -----------------------------------------------------------------------------
  const patch = (ids: number[], change: (p: CatalogProduct) => CatalogProduct | null, message: string) => {
    let changed = 0;
    const next = products.map(p => {
      if (!ids.includes(p.id)) return p;
      const updated = change(p);
      if (updated) changed++;
      return updated ?? p;
    });
    if (changed === 0) {
      onToast('Nothing to change');
      return;
    }
    onProductsChange(next);
    onToast(message.replace('{n}', String(changed)));
  };

  const setVisible = (ids: number[], is_active: boolean) =>
    patch(ids, p => (p.is_active !== is_active ? { ...p, is_active } : null),
      ids.length === 1 ? (is_active ? 'Now shown on the website' : 'Hidden from the website') : `{n} products ${is_active ? 'shown' : 'hidden'}`);
  const setFeatured = (ids: number[], is_featured: boolean) =>
    patch(ids, p => (p.is_featured !== is_featured ? { ...p, is_featured } : null),
      ids.length === 1 ? (is_featured ? 'Marked featured' : 'Removed from featured') : `{n} products ${is_featured ? 'featured' : 'unfeatured'}`);

  const saveStock = (p: CatalogProduct, qty: number) => {
    if (!Number.isFinite(qty) || qty < 0) { onToast('Enter a stock number of 0 or more'); return; }
    patch([p.id], x => ({ ...x, stock_quantity: Math.round(qty) }), `Stock for ${p.name} set to ${Math.round(qty)}`);
    setStockDraft(String(Math.round(qty)));
  };
  const savePrice = (p: CatalogProduct) => {
    const price = Number(priceDraft);
    if (!priceDraft.trim() || !Number.isFinite(price) || price <= 0) { onToast('Enter a price above 0'); return; }
    patch([p.id], x => ({ ...x, price: Math.round(price) }), `Price for ${p.name} set to ${rupees(price)}`);
  };

  const openProduct = (p: CatalogProduct) => {
    setOpenId(p.id);
    setImageIdx(0);
    setPriceDraft(p.price === null ? '' : String(p.price));
    setStockDraft(String(p.stock_quantity));
  };

  const runExport = async (rows: CatalogProduct[], format: ExportFormat, scope: string) => {
    if (rows.length === 0) { onToast('No products to export'); return; }
    try {
      await exportTable(format, {
        filename: `products-${TODAY}`,
        title: 'Products',
        subtitle: `${rows.length} products · ${scope} · sales are last 30 days · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Product', width: 26 },
          { header: 'Category', width: 11 },
          { header: 'Size', width: 11 },
          { header: 'SKU', width: 10 },
          { header: 'Price', width: 10, money: true },
          { header: 'Stock', width: 8 },
          { header: 'Stock status', width: 13 },
          { header: 'On website', width: 10 },
          { header: 'Featured', width: 9 },
          { header: 'Units sold', width: 10 },
          { header: 'Revenue', width: 12, money: true },
          { header: 'Rating', width: 9 },
        ],
        rows: rows.map(p => {
          const s = salesOf(p);
          return [
            p.name, p.category, p.size, p.sku ?? '', p.price, p.stock_quantity, STOCK_LABEL[stockState(p)],
            p.is_active ? 'Yes' : 'Hidden', p.is_featured ? 'Yes' : '', s.units, s.revenue,
            p.rating === null ? '' : `${p.rating} (${p.rating_count})`,
          ];
        }),
      });
      onToast(`Exported ${rows.length} products to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  // ---- Selection (table view) --------------------------------------------------------------
  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map(p => p.id)));
  const selectedIds = Array.from(selected);

  const StockBadge = ({ p }: { p: CatalogProduct }) => (
    <span className={`chip ${STOCK_CHIP[stockState(p)]}`}>
      {stockState(p) === 'out' ? 'Out of stock' : `${p.stock_quantity} in stock`}
    </span>
  );

  return (
    <>
      {/* 1. Summary tiles */}
      <div className="scoreboard">
        <div className="score">
          <div className="num">{tiles.total} <small>{tiles.active} live</small></div>
          <div className="label">Products · {tiles.total - tiles.active} hidden</div>
        </div>
        <div className="score">
          <div className="num">{tiles.low}</div>
          <div className="label">Low stock (≤ {LOW_STOCK_LEVEL})</div>
        </div>
        <div className="score">
          <div className="num">{tiles.out}</div>
          <div className="label">Out of stock</div>
        </div>
        <div className="score">
          <div className="num best-seller">{best ? best.name : '—'}</div>
          <div className="label">Best seller · {best ? `${salesOf(best).units} units, 30 days` : 'no sales'}</div>
        </div>
        <div className="score">
          <div className="num">{rupeesShort(tiles.revenue)}</div>
          <div className="label">Product sales · 30 days</div>
        </div>
        <div className="score">
          <div className="num">{tiles.incomplete} <small>{tiles.featured} featured</small></div>
          <div className="label">Incomplete listings</div>
        </div>
      </div>

      {/* 2. Needs-action strip */}
      <div className="alert-strip">
        <span className="alert-strip-label">Needs action</span>
        {(Object.keys(ALERTS) as Alert[]).map(key => {
          const n = products.filter(ALERTS[key].test).length;
          return (
            <button
              key={key}
              className={`alert-pill ${alert === key ? 'active' : ''} ${n === 0 ? 'zero' : ''}`}
              onClick={() => { setAlert(alert === key ? null : key); setSelected(new Set()); }}
            >
              <strong>{n}</strong> {ALERTS[key].label}
            </button>
          );
        })}
        {alert && <button className="link-btn clear-alert" onClick={() => setAlert(null)}>Show all products</button>}
      </div>

      {/* 3. Filters */}
      <div className="page-toolbar">
        <div className="filters">
          {(['all', 'Health', 'Nutrition'] as const).map(c => (
            <button
              key={c}
              className={`filter-chip ${category === c ? 'active' : ''}`}
              onClick={() => { setCategory(c); setSelected(new Set()); }}
            >
              {c === 'all' ? 'All' : c} ({c === 'all' ? products.length : products.filter(p => p.category === c).length})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <div className="view-toggle" role="group" aria-label="View">
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Card view" aria-label="Card view"><LayoutGrid size={16} /></button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} title="Table view" aria-label="Table view"><List size={16} /></button>
          </div>
          <ExportMenu onExport={format => runExport(filtered, format, 'current filters')} />
        </div>
      </div>

      <div className="filter-row">
        <input
          className="filter-input"
          type="search"
          placeholder="Search product, size, SKU…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value as typeof status)} aria-label="Website status">
          <option value="all">Shown & hidden</option>
          <option value="active">Shown on website</option>
          <option value="hidden">Hidden</option>
        </select>
        <select className="filter-select" value={stock} onChange={e => setStock(e.target.value as StockState | 'all')} aria-label="Stock">
          <option value="all">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <label className="check-filter">
          <input type="checkbox" checked={featuredOnly} onChange={e => setFeaturedOnly(e.target.checked)} /> Featured only
        </label>
        {alert && <span className="filter-note">Other filters are paused while a “Needs action” filter is on.</span>}
      </div>

      {/* 4. Bulk actions (table view) */}
      {view === 'table' && selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          <button className="btn-secondary btn-small" onClick={() => setVisible(selectedIds, true)}>Show on website</button>
          <button className="btn-secondary btn-small" onClick={() => setVisible(selectedIds, false)}>Hide</button>
          <button className="btn-secondary btn-small" onClick={() => setFeatured(selectedIds, true)}>Mark featured</button>
          <button className="btn-secondary btn-small" onClick={() => setFeatured(selectedIds, false)}>Unfeature</button>
          <ExportMenu small label="Export selected" onExport={format => runExport(products.filter(p => selected.has(p.id)), format, 'selected')} />
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* 5. Products */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>No products match these filters.</div>
      ) : view === 'grid' ? (
        <div className="catalog-grid">
          {filtered.map(p => {
            const s = salesOf(p);
            return (
              <div key={p.id} className={`catalog-card ${p.is_active ? '' : 'is-hidden'}`}>
                <button className="catalog-img" onClick={() => openProduct(p)} aria-label={`Open ${p.name}`}>
                  <img src={p.image} alt="" loading="lazy" />
                  {p.is_featured && <span className="featured-badge"><Star size={11} fill="currentColor" /> Featured</span>}
                  {!p.is_active && <span className="hidden-badge">Hidden</span>}
                </button>
                <div className="catalog-body">
                  <div className="catalog-cat">{p.category} · {p.size}</div>
                  <button className="link-btn catalog-name" onClick={() => openProduct(p)}>{p.name}</button>
                  <div className="catalog-row">
                    <span className="product-price">{p.price === null ? <span className="text-warn">No price</span> : rupees(p.price)}</span>
                    <StockBadge p={p} />
                  </div>
                  <div className="catalog-meta">
                    <span>{s.units} sold · 30d</span>
                    <span>{p.rating === null ? 'No ratings' : <>★ {p.rating} <span className="muted">({p.rating_count})</span></>}</span>
                  </div>
                  {listingGaps(p).length > 0 && <div className="catalog-gaps">Missing: {listingGaps(p).join(', ')}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table className="orders-table products-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num-col">Price</th>
                  <th>Stock</th>
                  <th className="num-col">Sold · 30d</th>
                  <th className="num-col">Revenue · 30d</th>
                  <th>Rating</th>
                  <th>Website</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const s = salesOf(p);
                  return (
                    <tr key={p.id} className={selected.has(p.id) ? 'row-selected' : undefined}>
                      <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} /></td>
                      <td>
                        <div className="product-cell">
                          <img src={p.image} alt="" loading="lazy" />
                          <div>
                            <button className="link-btn enq-name" onClick={() => openProduct(p)}>{p.name}</button>
                            {p.is_featured && <Star size={12} className="star-inline" fill="currentColor" aria-label="Featured" />}
                            <div className="loc">{p.size}{p.sku ? ` · ${p.sku}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td className="num-col">{p.price === null ? <span className="text-warn">—</span> : rupees(p.price)}</td>
                      <td><StockBadge p={p} /></td>
                      <td className="num-col">{s.units}</td>
                      <td className="num-col strong">{rupees(s.revenue)}</td>
                      <td>{p.rating === null ? <span className="loc">—</span> : <>★ {p.rating} <span className="loc">({p.rating_count})</span></>}</td>
                      <td><span className={`chip ${p.is_active ? 'delivered' : 'muted'}`}>{p.is_active ? 'Shown' : 'Hidden'}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="kanban-btn" onClick={() => openProduct(p)}>View</button>
                          <button className="kanban-btn" onClick={() => setVisible([p.id], !p.is_active)}>{p.is_active ? 'Hide' : 'Show'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {notForTelecallers.length > 0 && (
        <div className="info-note">
          <strong>{notForTelecallers.length} website products aren’t in the telecallers’ product list</strong>, so telecallers can’t record
          sales for them: {notForTelecallers.map(p => p.name).join(', ')}.
        </div>
      )}

      <div className="panel-note">
        Product details and photos come from the website catalogue. Stock, ratings, featured and translations are sample values.
        The backend doesn’t store yet: a low-stock level per product, batch and expiry dates, stock history, MRP vs selling price, GST/HSN and cost price.
      </div>

      {/* 6. Detail drawer */}
      {open && (() => {
        const s = salesOf(open);
        const maxDay = Math.max(1, ...s.daily);
        const topCities = Array.from(s.cities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const shelfLife = open.specifications.find(x => x.label === 'Shelf Life')?.value;
        const checklist = [
          { label: 'Price', ok: open.price !== null },
          { label: 'SKU', ok: !!open.sku },
          { label: 'Photos', ok: open.images.length > 0 },
          { label: 'Shelf life', ok: !!shelfLife },
          ...PRODUCT_LOCALES.map(l => ({ label: `${l.label} translation`, ok: open.translations.includes(l.code) })),
        ];
        return (
          <>
            <div className="drawer-overlay" onClick={() => setOpenId(null)} />
            <aside className="order-drawer product-drawer" role="dialog" aria-label={open.name}>
              <div className="drawer-head">
                <div>
                  <h3>{open.name}</h3>
                  <div className="loc">
                    {open.category} · {open.size} ·{' '}
                    <span className={`chip ${open.is_active ? 'delivered' : 'muted'}`}>{open.is_active ? 'Shown on website' : 'Hidden'}</span>
                    {open.is_featured && <> <span className="chip transit">Featured</span></>}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setOpenId(null)} aria-label="Close"><X size={20} /></button>
              </div>

              <div className="drawer-body">
                <section className="od-section">
                  <div className="gallery-main"><img src={open.images[imageIdx] ?? open.image} alt={open.name} /></div>
                  {open.images.length > 1 && (
                    <div className="gallery-thumbs">
                      {open.images.map((src, i) => (
                        <button key={src} className={i === imageIdx ? 'active' : ''} onClick={() => setImageIdx(i)} aria-label={`Photo ${i + 1}`}>
                          <img src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="product-desc">{open.description}</p>
                </section>

                <section className="od-section od-row">
                  <div>
                    <div className="od-label">Price</div>
                    <div className="inline-edit">
                      <span className="prefix">₹</span>
                      <input type="number" min={1} value={priceDraft} onChange={e => setPriceDraft(e.target.value)} placeholder="Not set" aria-label="Price" />
                      {priceDraft !== (open.price === null ? '' : String(open.price)) && (
                        <button className="btn-secondary btn-small" onClick={() => savePrice(open)}>Save</button>
                      )}
                    </div>
                    {open.price === null && <div className="loc text-warn" style={{ marginTop: 4 }}>No price, so customers can’t buy it online.</div>}
                  </div>
                  <div>
                    <div className="od-label">Stock</div>
                    <div className="inline-edit">
                      <input type="number" min={0} value={stockDraft} onChange={e => setStockDraft(e.target.value)} aria-label="Stock quantity" />
                      {stockDraft !== String(open.stock_quantity) && (
                        <button className="btn-secondary btn-small" onClick={() => saveStock(open, Number(stockDraft))}>Save</button>
                      )}
                    </div>
                    <div className="stock-quick">
                      <StockBadge p={open} />
                      <button className="kanban-btn" onClick={() => saveStock(open, open.stock_quantity + 10)}>+10</button>
                      <button className="kanban-btn" onClick={() => saveStock(open, open.stock_quantity + 50)}>+50</button>
                    </div>
                  </div>
                </section>

                <section className="od-section">
                  <div className="od-label">Sales · last 30 days</div>
                  <div className="od-row" style={{ marginBottom: 10 }}>
                    <div><div className="mini-num">{s.units}</div><div className="loc">units sold</div></div>
                    <div><div className="mini-num">{rupees(s.revenue)}</div><div className="loc">revenue</div></div>
                  </div>
                  <div className="bar-chart dense mini-trend" role="img" aria-label={`${s.units} units sold in the last 30 days`}>
                    {s.daily.map((u, i) => (
                      <div key={i} className="bc-col" data-tip={`${u} ${u === 1 ? 'unit' : 'units'}`}>
                        <div className={`bc-bar ${i === 29 ? 'now' : ''}`} style={{ height: `${(u / maxDay) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="loc" style={{ marginTop: 8 }}>
                    {topCities.length ? `Top cities: ${topCities.map(([c, n]) => `${c} (${n})`).join(', ')}` : 'No sales in the last 30 days.'}
                  </div>
                  {!telecallerNames.has(open.name) && (
                    <div className="loc text-warn" style={{ marginTop: 6 }}>Not in the telecallers’ product list, so phone sales can’t be recorded.</div>
                  )}
                </section>

                <section className="od-section">
                  <div className="od-label">Listing checklist</div>
                  <ul className="checklist">
                    {checklist.map(c => (
                      <li key={c.label} className={c.ok ? 'ok' : 'missing'}>
                        {c.ok ? <Check size={14} /> : <X size={14} />} {c.label}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="od-section product-details">
                  <details open>
                    <summary>About the product</summary>
                    <p>{open.long_description}</p>
                  </details>
                  <details>
                    <summary>Highlights</summary>
                    <ul>{open.highlights.map(h => <li key={h}>{h}</li>)}</ul>
                  </details>
                  <details>
                    <summary>Composition</summary>
                    <p>{open.ingredients}</p>
                  </details>
                  <details>
                    <summary>Usage &amp; dosage</summary>
                    <p className="pre">{open.usage_instructions}</p>
                  </details>
                  <details>
                    <summary>Storage</summary>
                    <p>{open.storage_instructions}</p>
                  </details>
                  <details>
                    <summary>Recommended for</summary>
                    <ul>{open.recommended_for.map(r => <li key={r}>{r}</li>)}</ul>
                  </details>
                  <details>
                    <summary>Specifications</summary>
                    <table>
                      <tbody>
                        {open.specifications.map(sp => (
                          <tr key={sp.label}><td className="loc">{sp.label}</td><td>{sp.value || <span className="text-warn">Not set</span>}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </section>
              </div>

              <div className="drawer-actions">
                <button className="btn-secondary" onClick={() => setVisible([open.id], !open.is_active)}>
                  {open.is_active ? 'Hide from website' : 'Show on website'}
                </button>
                <button className="btn-secondary" onClick={() => setFeatured([open.id], !open.is_featured)}>
                  <Star size={14} /> {open.is_featured ? 'Unfeature' : 'Mark featured'}
                </button>
                <ExportMenu label="Export" onExport={format => runExport([open], format, open.name)} />
              </div>
            </aside>
          </>
        );
      })()}
    </>
  );
}
