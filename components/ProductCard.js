'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import QuickView from './QuickView';
import NotifyMeForm from './NotifyMeForm';

export default function ProductCard({ product }) {
  // ── Business logic — DO NOT MODIFY ───────────────────────────
  const { addToCart, toggleWishlist, wishlist = [] } = useApp();

  const wishlisted  = wishlist.map(String).includes(String(product.id));
  const isOutOfStock = product.stock <= 0 || product.isOutOfStock;
  const name        = product.title || product.name;

  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Scroll-triggered 3D reveal: card fades up into place the first
  // time it enters the viewport.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mouse-tracking 3D tilt + radial spotlight follow.
  function handleMouseMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect   = el.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const midX   = rect.width  / 2;
    const midY   = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 6;
    const rotateX = ((midY - y) / midY) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    el.style.setProperty('--spot-x', `${(x / rect.width)  * 100}%`);
    el.style.setProperty('--spot-y', `${(y / rect.height) * 100}%`);
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = '';
  }

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };
  // ─────────────────────────────────────────────────────────────

  /* Discount percent badge */
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      ref={cardRef}
      className={`product-card-3d${visible ? ' product-card-3d--visible' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Radial spotlight follows cursor */}
      <span className="product-card-3d__spot" aria-hidden="true" />

      {/* Sale badge */}
      {product.isOnSale && !isOutOfStock && discountPct && (
        <span className="product-card-3d__badge">−{discountPct}%</span>
      )}

      {/* Out-of-stock overlay label */}
      {isOutOfStock && (
        <span className="product-card-3d__oos-label">Sold Out</span>
      )}

      {/* Wishlist toggle */}
      <button
        type="button"
        onClick={handleWishlistClick}
        className={`product-card-3d__wishlist${wishlisted ? ' product-card-3d__wishlist--active' : ''}`}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wishlisted ? '♥' : '♡'}
      </button>

      {/* Quick View trigger */}
      {!isOutOfStock && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickViewOpen(true);
          }}
          className="product-card-3d__quickview-btn"
          aria-label="Quick view"
        >
          👁
        </button>
      )}

      {/* Product image */}
      <Link href={`/products/${product.id}`} className="product-card-3d__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="product-card-3d__image"
          src={product.image}
          alt={name}
          loading="lazy"
        />
      </Link>

      {/* Card body */}
      <div className="product-card-3d__body">
        <span className="product-card-3d__category">
          {product.category || 'TECH'}
        </span>

        <h3 className="product-card-3d__name">
          <Link href={`/products/${product.id}`}>{name}</Link>
        </h3>

        <div className="product-card-3d__rating" aria-label="Rating: 4 out of 5">
          ★★★★☆
        </div>

        <div className="product-card-3d__price-row">
          <span className="product-card-3d__price">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-card-3d__old-price">
              ${Number(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>

        {!isOutOfStock && product.stock <= 5 && (
          <span className="product-card-3d__urgency">
            🔥 Only {product.stock} left
          </span>
        )}
      </div>

      {/* Add to cart / Notify Me */}
      {isOutOfStock ? (
        <NotifyMeForm productId={product.id} compact />
      ) : (
        <button
          type="button"
          onClick={() => addToCart(product.id, 1)}
          className="btn btn--primary product-card-3d__add-btn"
        >
          Add to Cart
        </button>
      )}

      {quickViewOpen && (
        <QuickView product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </div>
  );
}
