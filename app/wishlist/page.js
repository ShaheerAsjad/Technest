'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
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

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="page-title mb-6">Your Wishlist</h1>
        <p>Loading Wishlist…</p>
      </div>
    );
  }

  if (wishlistedProducts.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="page-title mb-4">Your Wishlist</h1>
        <p className="mb-6">Your wishlist is currently empty.</p>
        <Link href="/products" className="btn btn--primary">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="page-title mb-6">Your Wishlist ({wishlistedProducts.length})</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 260px))',
          gap: '1.5rem',
          justifyContent: 'start'
        }}
      >
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}