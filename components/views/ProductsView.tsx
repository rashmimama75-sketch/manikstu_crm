import React, { useState } from 'react';
import { Product } from '../../data/initialData';

interface ProductsViewProps {
  products: Product[];
  onOpenAddProductModal: () => void;
}

export default function ProductsView({ products, onOpenAddProductModal }: ProductsViewProps) {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'Seeds', 'Fertilizer & soil', 'Crop protection', 'Oils & produce', 'Equipment'];

  const filteredProducts = products.filter((p) => {
    if (filter === 'All') return true;
    return p.category.toLowerCase() === filter.toLowerCase();
  });

  return (
    <>
      <div className="page-toolbar">
        <div className="filters">
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-chip ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onOpenAddProductModal}>
          + Add Product
        </button>
      </div>

      <div className="product-grid">
        {filteredProducts.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-icon">{p.icon}</div>
            <div className="product-name">{p.name}</div>
            <div className="product-cat">{p.category}</div>
            <div className="product-foot">
              <span className="product-price">{p.price}</span>
              <span className={`chip ${p.stockStatus === 'In stock' ? 'delivered' : 'pending'}`}>
                {p.stockStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
