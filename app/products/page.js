'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('default');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Increased to 8 for better grid filling

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setProducts(list);
          setFilteredProducts(list);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter((p) =>
        (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All Categories') {
      result = result.filter(
        (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === 'low-high') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    setFilteredProducts(result);
    setCurrentPage(1); // Reset to page 1 on search/filter change
  }, [searchTerm, selectedCategory, sortBy, products]);

  // Categories list
  const categories = [
    'All Categories',
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  // Calculate Pagination Data
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  if (loading) {
    return (
      <div className="catalog-page">
        <div className="container py-8 text-center">
          <div className="catalog-spinner" aria-hidden="true" />
          <p className="catalog-loading-text">Loading Products…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <div className="catalog-page__header">
        <div className="container">
          <h1 className="page-title catalog-page__title">All Products</h1>
          <p className="catalog-page__sub">Discover our entire collection of premium tech.</p>
        </div>
      </div>

      <div className="container py-4">
        {/* ── Search & Filter Bar ── */}
        <div className="catalog-controls">
          <div className="catalog-search-wrap">
            <svg className="catalog-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="form-input catalog-search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <div className="catalog-filters">
            <select
              className="form-input catalog-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="form-input catalog-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
            >
              <option value="default">Sort by: Featured</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ── Products Grid ── */}
        {filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <p className="catalog-empty__text">No products found matching your criteria.</p>
            <button className="btn btn--ghost mt-4" onClick={() => { setSearchTerm(''); setSelectedCategory('All Categories'); setSortBy('default'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="catalog-pagination">
            <button
              className="btn btn--secondary pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ← Prev
            </button>

            <span className="pagination-info">
              Page {currentPage} <span className="pagination-info--dim">of {totalPages}</span>
            </span>

            <button
              className="btn btn--secondary pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}