'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/data/products';

const PER_PAGE = 8;

const SORT_LABELS = {
  'price-asc': 'Sort: Price ↑',
  'price-desc': 'Sort: Price ↓',
  rating: 'Sort: Top Rated',
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever a filter changes so results always start fresh.
  useEffect(() => {
    setPage(1);
  }, [search, category, sortBy]);

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

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const pageResults = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const chips = [
    search && { key: 'search', label: `"${search}"`, clear: () => setSearch('') },
    category && { key: 'category', label: category, clear: () => setCategory('') },
    sortBy && { key: 'sort', label: SORT_LABELS[sortBy], clear: () => setSortBy('') },
  ].filter(Boolean);

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

      {chips.length > 0 && (
        <div className="filter-chips">
          {chips.map((chip) => (
            <button key={chip.key} className="filter-chip" onClick={chip.clear}>
              {chip.label} <span className="filter-chip__x">✕</span>
            </button>
          ))}
          <button
            className="filter-chip filter-chip--clear-all"
            onClick={() => {
              setSearch('');
              setCategory('');
              setSortBy('');
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <p className="empty-state">No products match your search.</p>
      ) : (
        <>
          <div className="product-grid">
            {pageResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="pagination__status">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn--secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
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
