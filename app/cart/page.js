'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useCartQuote } from '@/lib/useCartQuote';
import { useCoupon } from '@/lib/useCoupon';
import { formatPrice } from '@/lib/format';
import SafeImage from '@/components/SafeImage';
import CouponBox from '@/components/CouponBox';
import OrderSummaryRows from '@/components/OrderSummaryRows';

export default function CartPage() {
  const { cart, mounted, removeFromCart, updateQuantity } = useApp();
  const [coupon, applyCoupon] = useCoupon();
  const quote = useCartQuote({ coupon });
  const { lines, pricing, problems, warnings, loading, error } = quote;

  // Server may reduce quantities to available stock -> keep the local cart in sync.
  useEffect(() => {
    lines.forEach((l) => {
      const inCart = cart.find((c) => String(c.productId) === String(l.id));
      if (inCart && inCart.quantity > l.quantity) updateQuantity(l.id, l.quantity);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const removeUnavailable = () => problems.forEach((p) => removeFromCart(p.id));

  if (!mounted || (loading && lines.length === 0 && cart.length > 0)) {
    return (
      <div className="cart-page">
        <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
          <p className="catalog-loading-text">Loading Cart...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container py-8">
          <div className="catalog-empty">
            <h1 className="page-title mb-4">Your Cart</h1>
            <p className="catalog-empty__text mb-6">Your cart is currently empty.</p>
            <Link href="/products" className="btn btn--primary">Continue Shopping →</Link>
          </div>
        </div>
      </div>
    );
  }

  const blocked = Boolean(pricing?.minOrderProblem) || lines.length === 0;

  return (
    <div className="cart-page">
      <div className="container py-8">
        <h1 className="page-title mb-6">Your Cart</h1>

        {error && <div className="notice notice--error" role="alert">{error}</div>}
        {problems.length > 0 && (
          <div className="notice notice--warn" role="alert">
            {problems[0].message}
            <button type="button" className="notice__btn" onClick={removeUnavailable}>Remove unavailable items</button>
          </div>
        )}
        {warnings.map((w, i) => <div key={i} className="notice notice--warn">{w}</div>)}

        <div className="cart-layout">
          <div className="cart-items">
            {lines.map((item) => (
              <div key={item.id} className="cart-item">
                <Link href={`/products/${item.slug || item.id}`} className="cart-item__img-wrap">
                  <SafeImage src={item.image} alt={item.name} className="cart-item__img" />
                </Link>

                <div className="cart-item__details">
                  <h3 className="cart-item__title"><Link href={`/products/${item.slug || item.id}`}>{item.name}</Link></h3>
                  {item.sku && <p className="cart-item__sku">SKU: {item.sku}</p>}
                  <p className="cart-item__price">{formatPrice(item.price)}</p>
                </div>

                <div className="cart-qty-ctrl">
                  <button type="button" className="cart-qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">-</button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button type="button" className="cart-qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Increase quantity">+</button>
                </div>

                <div className="cart-item__total">{formatPrice(item.price * item.quantity)}</div>

                <button type="button" className="cart-item__remove" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-panel">
            <h2 className="cart-summary__title">Order Summary</h2>

            <CouponBox applied={pricing?.couponCode} error={pricing?.couponError} onApply={applyCoupon} disabled={loading} />

            {pricing ? <OrderSummaryRows pricing={pricing} estimateShipping /> : <p className="cart-summary__note">Calculating…</p>}
            {pricing?.minOrderProblem && <p className="coupon-box__error">{pricing.minOrderProblem}</p>}

            <Link href="/checkout" style={{ textDecoration: 'none', display: 'block' }} aria-disabled={blocked}>
              <button className="btn btn--primary cart-summary__btn" disabled={blocked || loading}>
                Proceed to Checkout →
              </button>
            </Link>

            <div className="cart-summary__secure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
