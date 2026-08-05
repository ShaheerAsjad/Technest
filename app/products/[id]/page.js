'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars } from '@/lib/format';
import { PRODUCTS } from '@/data/products';
import ProductCard from '@/components/ProductCard';

const RECENT_KEY = 'technest_recently_viewed';

export default function ProductDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const product = PRODUCTS.find((p) => p.id === id);

  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const updated = [product.id, ...ids.filter((i) => i !== product.id)].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecentIds(updated.filter((rid) => rid !== product.id));
    } catch {
      // localStorage unavailable — skip recently viewed tracking
    }
  }, [product]);

  if (!product) {
    return (
      <>
        <h1 className="page-title">Product not found</h1>
        <Link href="/products" className="btn btn--primary">
          Back to Products
        </Link>
      </>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const outOfStock = product.stock === 0;

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const recentProducts = recentIds.map((rid) => PRODUCTS.find((p) => p.id === rid)).filter(Boolean).slice(0, 4);

  return (
    <>
      <div className="details-layout">
        <div className="details-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="details-info">
          <p className="product-card__brand">{product.brand}</p>
          <h1 className="details-title">{product.name}</h1>
          <p className="details-rating">
            {renderStars(product.rating)} ({product.reviewCount} reviews)
          </p>
          <div className="details-price-row">
            <span className="details-price">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="product-card__old-price">{formatPrice(product.oldPrice)}</span>
            )}
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
        <>
          <h2 className="section-title">Related Products</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      {recentProducts.length > 0 && (
        <>
          <h2 className="section-title">Recently Viewed</h2>
          <div className="product-grid">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
