'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist = [] } = useApp();

  const wishlisted = wishlist.map(String).includes(String(product.id));
  const isOutOfStock = product.stock <= 0 || product.isOutOfStock;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div 
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #f3f4f6',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        position: 'relative',
        padding: '16px'
      }}
    >
      {/* Sale Badge */}
      {product.isOnSale && !isOutOfStock && (
        <span
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '12px',
            zIndex: 2,
          }}
        >
          Sale
        </span>
      )}

      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          color: wishlisted ? '#ef4444' : '#ffffff',
          fontSize: '14px',
          lineHeight: 1
        }}
        aria-label="Wishlist"
      >
        {wishlisted ? '♥' : '♡'}
      </button>

      {/* Product Image Container */}
      <div 
        style={{
          width: '100%',
          height: '200px',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f9fafb',
          marginBottom: '12px'
        }}
      >
        <Link href={`/products/${product.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title || product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Link>
      </div>

      {/* Product Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {product.category || 'TECH'}
        </span>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
          <Link href={`/products/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.title || product.name}
          </Link>
        </h3>

        {/* Rating Stars */}
        <div style={{ display: 'flex', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '8px' }}>
          ★★★★★
        </div>

        {/* Price & Original Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
            ${Number(product.price).toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through' }}>
              ${Number(product.originalPrice).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={() => addToCart(product.id, 1)}
        disabled={isOutOfStock}
        style={{
          width: '100%',
          backgroundColor: isOutOfStock ? '#6b7280' : '#0070f3',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontWeight: '600',
          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'background-color 0.2s',
          opacity: isOutOfStock ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#0051cc';
        }}
        onMouseLeave={(e) => {
          if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#0070f3';
        }}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}