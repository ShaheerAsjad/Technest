'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
  const { wishlist = [] } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Wishlist Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // String Conversion Fix: Matches both number ID (1) and string ID ("1")
  const wishlistedProducts = products.filter((p) =>
    wishlist.map(String).includes(String(p.id))
  );
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <p className="catalog-loading-text">Loading Wishlist…</p>
      </div>
    );
  }

  if (wishlistedProducts.length === 0) {
    return (
      <div className="container py-8">
        <div className="orders-header">
          <h1 className="page-title">Your Wishlist</h1>
        </div>
        <div className="catalog-empty mt-6">
          <div className="orders-empty-icon">♡</div>
          <p className="catalog-empty__text" style={{ marginBottom: '20px' }}>Your wishlist is currently empty.</p>
          <p className="catalog-empty__hint">Browse our catalog and save items you love for later.</p>
          <Link href="/products" className="btn btn--primary mt-4">
            Explore Products →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="orders-header">
        <h1 className="page-title">Your Wishlist</h1>
        <p className="catalog-page__sub">{wishlistedProducts.length} saved item{wishlistedProducts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="product-grid mt-6">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}