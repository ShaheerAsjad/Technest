'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { PRODUCTS } from '@/data/products';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { wishlist } = useApp();
  const items = wishlist.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  return (
    <>
      <h1 className="page-title">Your Wishlist</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your wishlist is empty.</p>
          <Link href="/products" className="btn btn--primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
