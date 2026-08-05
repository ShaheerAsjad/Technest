'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/data/products';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('');

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    let base = !term
      ? PRODUCTS
      : PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            p.tags.some((tag) => tag.includes(term))
        );

    if (category) base = base.filter((p) => p.category === category);

    const sorted = [...base];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);

    return sorted;
  }, [search, category, sortBy]);

  return (
    <>
      <h1 className="page-title">All Products</h1>
      <div className="toolbar">
        <input
          className="toolbar__input"
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="toolbar__select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="toolbar__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {results.length === 0 ? (
        <p className="empty-state">No products match your search.</p>
      ) : (
        <div className="product-grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p className="page-title">Loading…</p>}>
      <ProductsContent />
    </Suspense>
  );
}
