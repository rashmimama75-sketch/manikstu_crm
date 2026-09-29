// Central inventory: stock of each website catalogue product at every stock point
// (Manikstu warehouses and franchise hubs). Sample values until the backend tracks stock
// per location; products, names and photos come from the real catalogue.

import { CATALOG_PRODUCTS } from './catalogProducts';

export type StockPointKind = 'warehouse' | 'franchise';
/** Odisha revenue divisions. */
export type OdishaRegion = 'Central' | 'Northern' | 'Southern';
export const ODISHA_REGIONS: OdishaRegion[] = ['Central', 'Northern', 'Southern'];

export interface StockPoint {
  id: string;
  kind: StockPointKind;
  name: string;
  city: string;
  district: string;
  region: OdishaRegion;
}

export const STOCK_POINTS: StockPoint[] = [
  { id: 'WH-BBSR', kind: 'warehouse', name: 'Bhubaneswar warehouse', city: 'Bhubaneswar', district: 'Khordha', region: 'Central' },
  { id: 'WH-CTC', kind: 'warehouse', name: 'Cuttack warehouse', city: 'Cuttack', district: 'Cuttack', region: 'Central' },
  { id: 'WH-BLS', kind: 'warehouse', name: 'Balasore warehouse', city: 'Balasore', district: 'Balasore', region: 'Central' },
  { id: 'WH-BAM', kind: 'warehouse', name: 'Berhampur warehouse', city: 'Berhampur', district: 'Ganjam', region: 'Southern' },
  { id: 'FR-1', kind: 'franchise', name: 'Agri Hub Cuttack', city: 'Cuttack', district: 'Cuttack', region: 'Central' },
  { id: 'FR-2', kind: 'franchise', name: 'Agri Hub Berhampur', city: 'Berhampur', district: 'Ganjam', region: 'Southern' },
  { id: 'FR-3', kind: 'franchise', name: 'Agri Hub Balasore', city: 'Balasore', district: 'Balasore', region: 'Central' },
  { id: 'FR-4', kind: 'franchise', name: 'Agri Hub Puri', city: 'Puri', district: 'Puri', region: 'Central' },
  { id: 'FR-5', kind: 'franchise', name: 'Agri Hub Rourkela', city: 'Rourkela', district: 'Sundargarh', region: 'Northern' },
];

export interface StockRow {
  id: string;
  productId: number;
  pointId: string;
  stock: number;
  reorderLevel: number;
  leadTimeDays: number;
  restockedDaysAgo: number;
}

export type StockStatus = 'OK' | 'Low stock' | 'Out of stock';
export const stockStatus = (r: StockRow): StockStatus =>
  r.stock === 0 ? 'Out of stock' : r.stock < r.reorderLevel ? 'Low stock' : 'OK';

export const pointById = (id: string) => STOCK_POINTS.find(p => p.id === id)!;
export const productById = (id: number) => CATALOG_PRODUCTS.find(p => p.id === id)!;

// Small seeded generator so the sample stock is the same on every load.
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

function buildStock(): StockRow[] {
  const rand = seeded(42);
  const rows: StockRow[] = [];
  CATALOG_PRODUCTS.filter(p => p.is_active).forEach(p => {
    STOCK_POINTS.forEach(pt => {
      // Warehouses carry the full range; hubs carry about two-thirds of it.
      if (pt.kind === 'franchise' && rand() < 0.33) return;
      const reorderLevel = pt.kind === 'warehouse' ? 40 : 12;
      const roll = rand();
      const stock = roll < 0.06 ? 0 : roll < 0.24 ? Math.round(reorderLevel * (0.2 + rand() * 0.7)) : Math.round(reorderLevel * (1 + rand() * 2.5));
      rows.push({
        id: `${pt.id}-${p.id}`,
        productId: p.id,
        pointId: pt.id,
        stock,
        reorderLevel,
        leadTimeDays: pt.kind === 'warehouse' ? 5 + Math.floor(rand() * 6) : 2 + Math.floor(rand() * 3),
        restockedDaysAgo: 1 + Math.floor(rand() * 14),
      });
    });
  });
  return rows;
}

export const INITIAL_STOCK: StockRow[] = buildStock();
