'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars } from '@/lib/format';
import ProductCard from '@/components/ProductCard';

const RECENT_KEY = 'technest_recently_viewed';

export default function ProductDetailsPage() {
  const params = useParams();
  const id = String(params.id);

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [recentIds, setRecentIds] = useState([]);

  const { addToCart, toggleWishlist, isInWishlist } = useApp();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        // Direct sql query ke bajaye client-safe API endpoint se products laayein
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data);
        }
      } catch (error) {
        console.error("Fetch Error in Product Details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const product = allProducts.find((p) => String(p.id) === id);

  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const updated = [product.id, ...ids.filter((i) => String(i) !== String(product.id))].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecentIds(updated.filter((rid) => String(rid) !== String(product.id)));
    } catch {
      // localStorage fallback
    }
  }, [product]);

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <p className="page-title">Loading Product Details…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8 text-center">
        <h1 className="page-title mb-4">Product Not Found</h1>
        <p className="mb-6">The requested product could not be found.</p>
        <Link href="/products" className="btn btn--primary">
          Back to Products
        </Link>
      </div>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const outOfStock = product.stock === 0;

  const related = allProducts
    .filter((p) => p.category === product.category && String(p.id) !== String(product.id))
    .slice(0, 4);

  const recentProducts = recentIds
    .map((rid) => allProducts.find((p) => String(p.id) === String(rid)))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="container py-8">
      <div className="details-layout">
        <div className="details-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="details-info">
          <p className="product-card__brand">{product.brand}</p>
          <h1 className="details-title">{product.name}</h1>
          <p className="details-rating">
            {renderStars(product.rating)} ({product.reviewCount || 12} reviews)
          </p>
          <div className="details-price-row">
            <span className="details-price">{formatPrice(product.price)}</span>
          </div>
          <p className="details-description">{product.description}</p>
          <p className={`details-stock ${outOfStock ? 'details-stock--out' : ''}`}>
            {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </p>

          <div className="details-qty-row">
            <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="qty-value">{quantity}</span>
            <button
              className="qty-btn"
              onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
            >
              +
            </button>
          </div>

          <div className="details-actions">
            <button
              className="btn btn--primary"
              disabled={outOfStock}
              onClick={() => addToCart(product.id, quantity)}
            >
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`btn btn--secondary${wishlisted ? ' product-card__wishlist-btn--active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
            >
              {wishlisted ? '♥ In Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="section-title">Related Products</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {recentProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="section-title">Recently Viewed</h2>
          <div className="product-grid">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}