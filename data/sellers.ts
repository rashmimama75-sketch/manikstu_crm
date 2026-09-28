// Sellers who list their products on Manikstu. Sample data: the backend has no sellers
// table yet, and products have no seller column, so which seller owns which catalogue
// product (by product id in catalogProducts.ts) is set here.

export interface Seller {
  id: number;
  /** Login that belongs to this seller (lib/users.ts). */
  userId: string;
  business: string;
  owner: string;
  city: string;
  gstin: string;
  /** Manikstu's commission on each sale, in percent. */
  commissionPct: number;
  /** Delivered orders are paid out this many days after delivery. */
  payoutAfterDays: number;
  productIds: number[];
}

export const SELLERS: Seller[] = [
  {
    id: 1,
    userId: 'u-sl-301',
    business: 'Odisha Herbal Vet Labs',
    owner: 'Sanjay Rath',
    city: 'Bhubaneswar',
    gstin: '21AAKFO4412M1Z6',
    commissionPct: 12,
    payoutAfterDays: 7,
    productIds: [1, 2, 3, 4, 5, 6, 15],
  },
  {
    id: 2,
    userId: 'u-sl-302',
    business: 'Kalinga Mineral Blocks',
    owner: 'Lipsa Mohanty',
    city: 'Cuttack',
    gstin: '21AAHCK7719Q1Z2',
    commissionPct: 12,
    payoutAfterDays: 7,
    productIds: [7, 8, 9, 10, 11, 12, 13, 14, 16],
  },
];

export const sellerForUser = (userId: string) => SELLERS.find(s => s.userId === userId);
