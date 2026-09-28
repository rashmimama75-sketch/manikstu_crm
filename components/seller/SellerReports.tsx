import React from 'react';
import type { CatalogProduct } from '../../data/catalogProducts';
import { TODAY } from '../../data/today';
import type { Seller } from '../../data/sellers';
import { MONTH, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, ExportTable, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import { ORDER_STATUS_LABEL, SellerOrder, counts } from './sellerData';

interface Report {
  name: string;
  desc: string;
  count: number;
  build: () => Omit<ExportTable, 'filename'>;
}

interface Props {
  seller: Seller;
  orders: SellerOrder[];
  products: CatalogProduct[];
  onToast: (msg: string) => void;
}

export default function SellerReports({ seller, orders, products, onToast }: Props) {
  const monthOrders = orders.filter(o => o.order.created_at.startsWith(MONTH));
  const settled = orders.filter(o => o.payout === 'Paid out' || o.payout === 'Due');
  const subtitle = (n: number, what: string) => `${seller.business} · GSTIN ${seller.gstin} · ${n} ${what} · exported ${shortDate(TODAY)}`;

  const reports: Report[] = [
    {
      name: 'Orders this month',
      desc: 'Every order with your products this month: customer, items, amount, payment and status.',
      count: monthOrders.length,
      build: () => ({
        title: 'Orders · this month',
        subtitle: subtitle(monthOrders.length, 'orders'),
        columns: [
          { header: 'Order', width: 13 }, { header: 'Placed', width: 15 }, { header: 'Customer', width: 20 }, { header: 'City', width: 13 },
          { header: 'Items', width: 34 }, { header: 'Amount', width: 11, money: true }, { header: 'Payment', width: 11 }, { header: 'Status', width: 11 },
        ],
        rows: monthOrders.map(o => [
          o.order.order_number, shortDateTime(o.order.created_at), o.order.customer_name, o.order.city,
          o.items.map(i => `${i.product_name} x ${i.quantity}`).join(', '), o.gross, `${o.order.payment_method} (${o.order.payment_status})`, ORDER_STATUS_LABEL[o.order.status],
        ]),
      }),
    },
    {
      name: 'Payout statement',
      desc: 'Delivered orders with sale amount, Manikstu commission and what you receive.',
      count: settled.length,
      build: () => ({
        title: 'Payout statement',
        subtitle: subtitle(settled.length, 'delivered orders') + ` · commission ${seller.commissionPct}%`,
        columns: [
          { header: 'Order', width: 13 }, { header: 'Delivered', width: 11 }, { header: 'Customer', width: 20 },
          { header: 'Sale', width: 11, money: true }, { header: 'Commission', width: 12, money: true }, { header: 'You get', width: 11, money: true }, { header: 'Payout', width: 10 },
        ],
        rows: settled.map(o => [
          o.order.order_number, o.deliveredAt ? shortDate(o.deliveredAt) : '', o.order.customer_name, o.gross, o.commission, o.net, o.payout,
        ]),
      }),
    },
    {
      name: 'Products & stock',
      desc: 'Your products with price, stock, listing status and units sold so far.',
      count: products.length,
      build: () => {
        const sold = (p: CatalogProduct) => orders
          .filter(o => counts(o))
          .reduce((s, o) => s + o.items.filter(i => i.product_name === p.name).reduce((n, i) => n + i.quantity, 0), 0);
        return {
          title: 'Products & stock',
          subtitle: subtitle(products.length, 'products'),
          columns: [
            { header: 'Product', width: 26 }, { header: 'Size', width: 10 }, { header: 'Category', width: 11 }, { header: 'Price', width: 10, money: true },
            { header: 'Stock', width: 8 }, { header: 'Listing', width: 9 }, { header: 'Units sold', width: 11 },
          ],
          rows: products.map(p => [p.name, p.size, p.category, p.price, p.stock_quantity, p.is_active ? 'Active' : 'Hidden', sold(p)]),
        };
      },
    },
  ];

  const run = async (r: Report, format: ExportFormat) => {
    if (r.count === 0) { onToast(`Nothing to export in ${r.name}`); return; }
    try {
      await exportTable(format, { filename: `${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${TODAY}`, ...r.build() });
      onToast(`${r.name} exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  return (
    <div className="report-grid">
      {reports.map(r => (
        <div key={r.name} className="report-card">
          <h3>{r.name}</h3>
          <div className="rdesc">{r.desc}</div>
          <div className="rmeta">
            <ExportMenu onExport={format => run(r, format)} />
            <span className="rgen">{r.count} rows</span>
          </div>
        </div>
      ))}
    </div>
  );
}
