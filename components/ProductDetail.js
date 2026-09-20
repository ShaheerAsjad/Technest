'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatPrice, renderStars } from '@/lib/format';
import { findZone } from '@/lib/pricing';
import { fetchJson } from '@/lib/client';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/ReviewsSection';
import SafeImage from '@/components/SafeImage';
import NotifyMeForm from '@/components/NotifyMeForm';

const RECENT_KEY = 'technest_recently_viewed';

export default function ProductDetail({ product, related = [], settings, trail = [] }) {
  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [recent, setRecent] = useState([]);
  const [city, setCity] = useState('');

  const images = product.images?.length ? product.images : [product.image];
  const outOfStock = product.stock <= 0;
  const wishlisted = isInWishlist(product.id);
  const shipping = settings?.shipping || {};
  const store = settings?.store || {};

  // Recently viewed (stored locally, loaded through the lean by-ids API)
  useEffect(() => {
    let ids = [];
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      ids = Array.isArray(parsed) ? parsed : [];
      const updated = [product.id, ...ids.filter((i) => String(i) !== String(product.id))].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch { /* storage unavailable */ }
    const others = ids.filter((i) => String(i) !== String(product.id)).slice(0, 4);
    if (!others.length) return undefined;
    let cancelled = false;
    (async () => {
      const res = await fetchJson(`/api/products/by-ids?ids=${others.join(',')}`);
      if (!cancelled && res.ok) setRecent((res.data?.items || []).filter((p) => !p.isArchived));
    })();
    return () => { cancelled = true; };
  }, [product.id]);

  // Delivery estimate for the customer's city
  const delivery = useMemo(() => {
    if (!shipping.enabled) return { free: true, text: 'Free delivery' };
    const zone = findZone({ shipping }, city);
    const threshold = zone && zone.freeThreshold !== null && zone.freeThreshold !== undefined ? zone.freeThreshold : shipping.freeThreshold;
    const free = product.freeShipping || (shipping.freeEnabled && threshold > 0 && product.price * quantity >= threshold);
    const eta = zone?.eta || shipping.etaText || '';
    if (free) return { free: true, text: `Free delivery${eta ? ` · ${eta}` : ''}` };
    const fee = zone ? zone.fee : shipping.defaultFee;
    return { free: false, text: `Delivery ${formatPrice(fee)}${eta ? ` · ${eta}` : ''}`, hint: shipping.freeEnabled && threshold > 0 ? `Free on orders over ${formatPrice(threshold)}` : '' };
  }, [shipping, city, product.freeShipping, product.price, quantity]);

  const cityOptions = useMemo(
    () => [...new Set((shipping.zones || []).flatMap((z) => z.cities || []))].slice(0, 60),
    [shipping.zones]
  );

  const wa = String(store.whatsapp || store.phone || '').replace(/[^0-9]/g, '');
  const waHref = wa
    ? `https://wa.me/${wa.startsWith('0') ? `92${wa.slice(1)}` : wa}?text=${encodeURIComponent(`Hello, I want to order: ${product.name}${product.sku ? ` (SKU ${product.sku})` : ''} × ${quantity}`)}`
    : '';

  const specEntries = Object.entries(product.specs || {}).filter(([k, v]) => k && v !== '' && v !== null && v !== undefined);
  const activeSrc = images[Math.min(activeImg, images.length - 1)];

  return (
    <div className="container py-8">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs__list">
          <li className="breadcrumbs__item"><Link href="/">Home</Link></li>
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item"><Link href="/products">Products</Link></li>
          {trail.map((t) => (
            <Fragment key={t.slug}>
              <li className="breadcrumbs__separator" aria-hidden="true">/</li>
              <li className="breadcrumbs__item"><Link href={`/category/${t.slug}`}>{t.name}</Link></li>
            </Fragment>
          ))}
          <li className="breadcrumbs__separator" aria-hidden="true">/</li>
          <li className="breadcrumbs__item breadcrumbs__item--current" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="details-layout mt-6">
        <div className="details-image-wrap details-gallery">
          {product.isOnSale && !outOfStock && <span className="details-badge">Sale</span>}
          <SafeImage src={activeSrc} alt={product.name} className="details-image" loading="eager" />
          {images.length > 1 && (
            <div className="details-thumbs">
              {images.map((src, i) => (
                <button key={src + i} type="button" className={`details-thumb${i === activeImg ? ' is-active' : ''}`} onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`}>
                  <SafeImage src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="details-info-panel">
          <div className="details-info-header">
            <p className="product-card__brand">
              {product.brand
                ? <Link href={`/products?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
                : product.category}
            </p>
            <h1 className="details-title">{product.name}</h1>
            {product.sku && <p className="details-sku">SKU: <strong>{product.sku}</strong></p>}

            {product.rating ? (
              <div className="details-rating-row">
                <span className="details-stars">{renderStars(product.rating)}</span>
                <span className="details-review-count">({product.reviewCount} review{product.reviewCount === 1 ? '' : 's'})</span>
              </div>
            ) : null}
          </div>

          <div className="details-price-row">
            <span className="details-price">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && <span className="details-old-price">{formatPrice(product.originalPrice)}</span>}
          </div>

          {product.description && (
            <div className="details-description-box">
              <p className="details-description">{product.description}</p>
            </div>
          )}

          <div className="details-stock-status">
            <span className={`details-stock-indicator ${outOfStock ? 'details-stock-indicator--out' : ''}`} />
            <p className={`details-stock ${outOfStock ? 'details-stock--out' : ''}`}>
              {outOfStock ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock'}
            </p>
          </div>

          {outOfStock && (
            <div className="details-notify">
              <p className="details-delivery__title">🔔 Get notified when it is back in stock</p>
              <NotifyMeForm productId={product.id} />
            </div>
          )}

          <div className="details-action-group">
            <div className="details-qty-row">
              <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={outOfStock} aria-label="Decrease quantity">-</button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))} disabled={outOfStock || quantity >= product.stock} aria-label="Increase quantity">+</button>
            </div>

            <div className="details-actions">
              <button className="btn btn--primary details-add-btn" disabled={outOfStock} onClick={() => addToCart(product.id, quantity)}>
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

          <div className="details-delivery">
            <p className="details-delivery__title">🚚 Delivery estimate</p>
            <div className="details-delivery__row">
              <input
                className="form-input details-delivery__input"
                placeholder="Enter your city (e.g. Lahore)"
                value={city}
                list="delivery-cities"
                onChange={(e) => setCity(e.target.value)}
                aria-label="Your city"
              />
              {cityOptions.length > 0 && (
                <datalist id="delivery-cities">
                  {cityOptions.map((c) => <option key={c} value={c.charAt(0).toUpperCase() + c.slice(1)} />)}
                </datalist>
              )}
            </div>
            <p className={`details-delivery__result${delivery.free ? ' is-free' : ''}`}>{delivery.text}</p>
            {delivery.hint && <p className="details-delivery__hint">{delivery.hint}</p>}
          </div>

          <div className="details-buy-alt">
            {waHref && <a className="btn btn--ghost" href={waHref} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>}
            <Link className="btn btn--ghost" href={`/b2b?product=${encodeURIComponent(product.sku || product.name)}`}>Bulk / B2B quote</Link>
          </div>

          <div className="details-trust">
            <div className="details-trust-item"><span className="details-trust-icon">✔</span> Genuine product</div>
            {settings?.payment?.codEnabled && <div className="details-trust-item"><span className="details-trust-icon">₨</span> Cash on Delivery available</div>}
            <div className="details-trust-item"><span className="details-trust-icon">↺</span> <Link href="/return-policy">Return policy</Link></div>
          </div>
        </div>
      </div>

      {specEntries.length > 0 && (
        <section className="mt-12">
          <div className="section-title-wrap"><h2 className="section-title">Specifications</h2></div>
          <div className="details-specs-wrap">
            <table className="details-specs">
              <tbody>
                {specEntries.map(([k, v]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{String(v)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <div className="mt-12">
          <div className="section-title-wrap"><h2 className="section-title">Related Products</h2></div>
          <div className="product-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-12">
          <div className="section-title-wrap"><h2 className="section-title">Recently Viewed</h2></div>
          <div className="product-grid">{recent.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}

      <div className="mt-12">
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
}
