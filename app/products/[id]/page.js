'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars } from '@/lib/format';
import ProductCard from '@/components/ProductCard';

const RECENT_KEY = 'technest_recently_viewed';

export default function ProductDetailsPage() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
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
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <p className="catalog-loading-text">Loading Details…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="page-title mb-4">Product Not Found</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>The requested product could not be found or is no longer available.</p>
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
      {/* ── Breadcrumbs ── */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs__list">
          <li className="breadcrumbs__item"><Link href="/">Home</Link></li>
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item"><Link href="/products">Products</Link></li>
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item"><Link href={`/products?category=${product.category}`}>{product.category || 'Category'}</Link></li>
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item breadcrumbs__item--current" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* ── Product Details Layout ── */}
      <div className="details-layout mt-6">
        {/* Left: Image */}
        <div className="details-image-wrap">
          {product.isOnSale && !outOfStock && (
            <span className="details-badge">Sale</span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="details-image" />
        </div>

        {/* Right: Info panel */}
        <div className="details-info-panel">
          <div className="details-info-header">
            <p className="product-card__brand">{product.brand || 'TECHNEST'}</p>
            <h1 className="details-title">{product.name}</h1>
            
            <div className="details-rating-row">
              <span className="details-stars">{renderStars(product.rating)}</span>
              <span className="details-review-count">({product.reviewCount || 12} reviews)</span>
            </div>
          </div>

          <div className="details-price-row">
            <span className="details-price">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="details-old-price">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <div className="details-description-box">
            <p className="details-description">{product.description}</p>
          </div>

          <div className="details-stock-status">
            <span className={`details-stock-indicator ${outOfStock ? 'details-stock-indicator--out' : ''}`} />
            <p className={`details-stock ${outOfStock ? 'details-stock--out' : ''}`}>
              {outOfStock ? 'Out of Stock' : `${product.stock} items in stock`}
            </p>
          </div>

          <div className="details-action-group">
            <div className="details-qty-row">
              <button 
                className="qty-btn" 
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                disabled={outOfStock || quantity >= product.stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <div className="details-actions">
              <button
                className="btn btn--primary details-add-btn"
                disabled={outOfStock}
                onClick={() => addToCart(product.id, quantity)}
              >
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                className={`btn btn--secondary details-wishlist-btn ${wishlisted ? ' product-card__wishlist-btn--active' : ''}`}
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlisted ? '♥ Saved' : '♡ Save'}
              </button>
            </div>
          </div>
          
          <div className="details-trust">
            <div className="details-trust-item">
              <span className="details-trust-icon">🚚</span> Free delivery over $100
            </div>
            <div className="details-trust-item">
              <span className="details-trust-icon">↩️</span> 30-day return policy
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <div className="mt-12">
          <div className="section-title-wrap">
            <h2 className="section-title">Related Products</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Viewed ── */}
      {recentProducts.length > 0 && (
        <div className="mt-12">
          <div className="section-title-wrap">
            <h2 className="section-title">Recently Viewed</h2>
          </div>
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