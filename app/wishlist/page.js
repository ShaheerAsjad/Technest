'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { fetchJson } from '@/lib/client';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { wishlist = [], mounted } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const idsKey = wishlist.map(String).join(',');

  useEffect(() => {
    if (!mounted) return undefined;
    if (!idsKey) { setProducts([]); setLoading(false); return undefined; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetchJson(`/api/products/by-ids?ids=${encodeURIComponent(idsKey.split(',').slice(0, 60).join(','))}`);
      if (cancelled) return;
      if (res.ok) { setProducts((res.data?.items || []).filter((p) => !p.isArchived)); setFailed(false); }
      else setFailed(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [idsKey, mounted]);

  if (!mounted || loading) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <p className="catalog-loading-text">Loading Wishlist...</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="container py-8">
        <div className="catalog-empty">
          <h1 className="page-title mb-4">Your Wishlist</h1>
          <p className="catalog-empty__text">We could not load your wishlist. Please check your connection and refresh.</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container py-8">
        <div className="orders-header"><h1 className="page-title">Your Wishlist</h1></div>
        <div className="catalog-empty mt-6">
          <div className="orders-empty-icon">♡</div>
          <p className="catalog-empty__text" style={{ marginBottom: '20px' }}>Your wishlist is currently empty.</p>
          <p className="catalog-empty__hint">Browse our catalogue and save items you love for later.</p>
          <Link href="/products" className="btn btn--primary mt-4">Explore Products →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="orders-header">
        <h1 className="page-title">Your Wishlist</h1>
        <p className="catalog-page__sub">{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="product-grid mt-6">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
