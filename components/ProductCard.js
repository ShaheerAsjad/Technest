'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist = [] } = useApp();

  const wishlisted = wishlist.map(String).includes(String(product.id));
  const isOutOfStock = product.stock <= 0 || product.isOutOfStock;
  const name = product.title || product.name;

  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Scroll-triggered 3D reveal: the card rotates in from a slight tilt
  // and fades up into place the first time it enters the viewport.
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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mouse-tracking 3D tilt: the card rotates slightly toward the cursor
  // and a glow spotlight follows the pointer, for a "futuristic" feel.
  function handleMouseMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 6;
    const rotateX = ((midY - y) / midY) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    el.style.setProperty('--spot-x', `${(x / rect.width) * 100}%`);
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

  return (
    <div
      ref={cardRef}
      className={`product-card-3d${visible ? ' product-card-3d--visible' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className="product-card-3d__spot" aria-hidden="true" />

      {product.isOnSale && !isOutOfStock && (
        <span className="product-card-3d__badge">Sale</span>
      )}

      <button
        type="button"
        onClick={handleWishlistClick}
        className={`product-card-3d__wishlist${wishlisted ? ' product-card-3d__wishlist--active' : ''}`}
        aria-label="Wishlist"
      >
        {wishlisted ? '♥' : '♡'}
      </button>

      <Link href={`/products/${product.id}`} className="product-card-3d__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-card-3d__image" src={product.image} alt={name} loading="lazy" />
      </Link>

      <div className="product-card-3d__body">
        <span className="product-card-3d__category">{product.category || 'TECH'}</span>

        <h3 className="product-card-3d__name">
          <Link href={`/products/${product.id}`}>{name}</Link>
        </h3>

        <div className="product-card-3d__rating">★★★★★</div>

        <div className="product-card-3d__price-row">
          <span className="product-card-3d__price">${Number(product.price).toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-card-3d__old-price">
              ${Number(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => addToCart(product.id, 1)}
        disabled={isOutOfStock}
        className="btn btn--primary product-card-3d__add-btn"
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}
