'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function QuickView({ product, onClose }) {
  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const name = product.title || product.name;
  const outOfStock = product.stock <= 0;
  const wishlisted = isInWishlist(product.id);

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-panel" onClick={(e) => e.stopPropagation()}>
        <button className="quickview-close" onClick={onClose} aria-label="Close quick view">
          &times;
        </button>

        <div className="quickview-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={name} className="quickview-image" />
        </div>

        <div className="quickview-info">
          <span className="product-card-3d__category">{product.category || 'TECH'}</span>
          <h2 className="quickview-title">{name}</h2>

          <div className="quickview-price-row">
            <span className="quickview-price">${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="product-card-3d__old-price">
                ${Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="quickview-description">{product.description}</p>
          )}

          <p className={`details-stock ${outOfStock ? 'details-stock--out' : ''}`}>
            {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </p>

          {!outOfStock && (
            <div className="details-qty-row" style={{ marginTop: 'var(--spacing-2)' }}>
              <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span className="qty-value">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              >
                +
              </button>
            </div>
          )}

          <div className="quickview-actions">
            <button
              className="btn btn--primary"
              disabled={outOfStock}
              onClick={() => {
                addToCart(product.id, quantity);
                onClose();
              }}
            >
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`btn btn--secondary${wishlisted ? ' product-card-3d__wishlist--active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
            >
              {wishlisted ? '♥ Saved' : '♡ Save'}
            </button>
          </div>

          <Link href={`/products/${product.id}`} className="quickview-full-link" onClick={onClose}>
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}
