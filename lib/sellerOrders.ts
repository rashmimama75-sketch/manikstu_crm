import { cookies } from 'next/headers';
import { TOKEN_COOKIE, backendCall, usingBackend } from './backend';
import type { SalesOrder } from '../data/managerDashboard';
import type { CatalogProduct, ProductCategory } from '../data/catalogProducts';

/**
 * The signed-in seller's orders from the CRM backend — their slice of every
 * order that contains their products, including website orders that arrived
 * through the integration endpoint. Returns null in local mode or on any
 * failure, so the caller falls back to sample data.
 */
export async function fetchSellerOrders(): Promise<{ orders: SalesOrder[]; mixedOrderIds: number[] } | null> {
  if (!usingBackend()) return null;
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const r = await backendCall('/seller/orders', { token });
    if (!r.ok) return null;
    const body = await r.json().catch(() => null);
    if (!body || !Array.isArray(body.data)) return null;
    return { orders: body.data as SalesOrder[], mixedOrderIds: (body.mixedOrderIds ?? []) as number[] };
  } catch {
    return null;
  }
}

/** One product as the CRM backend's /seller/me endpoint returns it. */
interface BackendProduct {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  size: string | null;
  price: number | null;
  stock_quantity: number;
  is_active: boolean;
}

/**
 * Fill out a backend product into the fuller CatalogProduct shape the seller
 * dashboard expects. The backend is the source of truth for the fields it
 * tracks (name, price, category, visibility); the rest are left empty rather
 * than invented. Stock comes from the backend's per-product figure, which the
 * seller manages from the dashboard (restock).
 */
function toCatalogProduct(p: BackendProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: (p.category as ProductCategory) ?? 'Health',
    size: p.size ?? '',
    sku: null,
    price: p.price,
    stock_quantity: p.stock_quantity ?? 0,
    description: '',
    long_description: '',
    image: '',
    images: [],
    highlights: [],
    specifications: [],
    usage_instructions: '',
    storage_instructions: '',
    ingredients: '',
    recommended_for: [],
    rating: null,
    rating_count: 0,
    is_featured: false,
    is_active: p.is_active,
    order: 0,
    translations: [],
  };
}

/**
 * The signed-in seller's own catalogue from the CRM backend. Returns null in
 * local mode or on any failure, so the caller can fall back. On success the
 * products are the seller's real catalogue — no sample data.
 */
export async function fetchSellerProducts(): Promise<CatalogProduct[] | null> {
  if (!usingBackend()) return null;
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const r = await backendCall('/seller/me', { token });
    if (!r.ok) return null;
    const body = await r.json().catch(() => null);
    if (!body || !Array.isArray(body.products)) return null;
    return (body.products as BackendProduct[]).map(toCatalogProduct);
  } catch {
    return null;
  }
}
