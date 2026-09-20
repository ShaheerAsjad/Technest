'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars } from '@/lib/format';
import QuickView from './QuickView';
import NotifyMeForm from './NotifyMeForm';
import SafeImage from './SafeImage';

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist = [] } = useApp();

  const wishlisted = wishlist.map(String).includes(String(product.id));
  const isOutOfStock = product.stock <= 0 || product.isOutOfStock;
  const name = product.title || product.name;
  const href = `/products/${product.slug || product.id}`;

  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Scroll-triggered reveal: the card fades up the first time it enters the viewport.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
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

  // Mouse-tracking subtle 3D tilt + radial spotlight (skipped on touch devices).
  function handleMouseMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 3;
    const rotateX = ((midY - y) / midY) * 3;
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    el.style.setProperty('--spot-x', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--spot-y', `${(y / rect.height) * 100}%`);
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (el) el.style.transform = '';
  }

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

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
      <span className="product-card-3d__spot" aria-hidden="true" />

      {product.isOnSale && !isOutOfStock && discountPct && (
        <span className="product-card-3d__badge">-{discountPct}%</span>
      )}
      {isOutOfStock && <span className="product-card-3d__oos-label">Sold Out</span>}

      <button
        type="button"
        onClick={handleWishlistClick}
        className={`product-card-3d__wishlist${wishlisted ? ' product-card-3d__wishlist--active' : ''}`}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <HeartIcon filled={wishlisted} />
      </button>

      {!isOutOfStock && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
          className="product-card-3d__quickview-btn"
          aria-label="Quick view"
        >
          <EyeIcon />
        </button>
      )}

      <Link href={href} className="product-card-3d__image-wrap">
        <SafeImage className="product-card-3d__image" src={product.image} alt={name} />
      </Link>

      <div className="product-card-3d__body">
        <span className="product-card-3d__category">{product.brand || product.category || 'TECH'}</span>

        <h3 className="product-card-3d__name">
          <Link href={href}>{name}</Link>
        </h3>

        {product.sku && <span className="product-card-3d__sku">SKU: {product.sku}</span>}

        {product.rating ? (
          <div className="product-card-3d__rating" aria-label={`Rating: ${product.rating} out of 5`}>
            {renderStars(product.rating)} <span className="product-card-3d__rating-count">({product.reviewCount})</span>
          </div>
        ) : null}

        <div className="product-card-3d__price-row">
          <span className="product-card-3d__price">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-card-3d__old-price">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {product.freeShipping && !isOutOfStock && <span className="product-card-3d__free-ship">Free delivery</span>}

        {!isOutOfStock && product.stock <= 5 && (
          <span className="product-card-3d__urgency">Only {product.stock} left</span>
        )}
      </div>

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

      {quickViewOpen && <QuickView product={product} onClose={() => setQuickViewOpen(false)} />}
    </div>
  );
}
