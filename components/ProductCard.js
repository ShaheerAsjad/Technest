'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars, truncateText } from '@/lib/format';

export default function ProductCard({ product }) {
  const { id, name, brand, price, oldPrice, stock, rating, image } = product;
  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  const wishlisted = isInWishlist(id);
  const outOfStock = stock === 0;

  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <article
      ref={cardRef}
      className={`product-card reveal${visible ? ' reveal--visible' : ''}`}
      data-product-id={id}
    >
      {oldPrice && <span className="product-card__badge">Sale</span>}
      <button
        className={`product-card__wishlist-btn${wishlisted ? ' product-card__wishlist-btn--active' : ''}`}
        onClick={() => toggleWishlist(id)}
        aria-label="Toggle wishlist"
      >
        {wishlisted ? '♥' : '♡'}
      </button>
      <Link href={`/products/${id}`}>
        <div className="product-card__image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="product-card__image" src={image} alt={name} loading="lazy" />
        </div>
      </Link>
      <p className="product-card__brand">{brand}</p>
      <Link href={`/products/${id}`}>
        <h3 className="product-card__name" title={name}>
          {truncateText(name, 38)}
        </h3>
      </Link>
      <p className="product-card__rating">{renderStars(rating)}</p>
      <div className="product-card__price-row">
        <span className="product-card__price">{formatPrice(price)}</span>
        {oldPrice && <span className="product-card__old-price">{formatPrice(oldPrice)}</span>}
      </div>
      <button
        className="btn btn--primary product-card__add-btn"
        disabled={outOfStock}
        onClick={() => addToCart(id, 1)}
      >
        {outOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </article>
  );
}
