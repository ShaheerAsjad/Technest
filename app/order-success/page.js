'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState as useLocalState } from 'react';
import { formatPrice } from '@/lib/format';

const STEPS = [
  { icon: '📋', title: 'Order Placed', desc: 'Your order has been confirmed.' },
  { icon: '📦', title: 'Being Packed', desc: 'We are preparing your items.' },
  { icon: '🚚', title: 'Out for Delivery', desc: 'Your parcel is on the way.' },
  { icon: '✅', title: 'Delivered', desc: 'Enjoy your new tech!' },
];

function OrderSuccessContent() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
  const searchParams = useSearchParams();
  const orderId = (searchParams.get('orderId') || '').replace(/[^0-9]/g, '');
  const [order, setOrder] = useLocalState(null);

  // Best-effort: show the real payment method and total (works for the signed-in owner)
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrder(d))
      .catch(() => {});
  }, [orderId]);
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="success-page">
      <div className="success-panel">
        <div className="success-panel__glow" aria-hidden="true" />

        {/* Icon */}
        <div className="success-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-sub">
          Thank you for shopping with us. We have received your order and will contact you shortly to confirm delivery.
        </p>

        {/* Order Slip */}
        <div className="success-slip">
          <div className="success-slip__row">
            <span className="success-slip__label">Order ID</span>
            <span className="success-slip__value">{orderId ? `#${orderId}` : '—'}</span>
          </div>
          <div className="success-slip__row">
            <span className="success-slip__label">Payment Method</span>
            <span className="success-slip__value">{order?.payment_method || 'Cash on Delivery'}</span>
          </div>
          {order && (
            <div className="success-slip__row">
              <span className="success-slip__label">Order Total</span>
              <span className="success-slip__value">{formatPrice(order.total_amount)}</span>
            </div>
          )}
          <div className="success-slip__row">
            <span className="success-slip__label">Payment Status</span>
            <span className="success-slip__value success-slip__value--pending">Pending</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="success-steps">
          {STEPS.map((step, i) => (
            <div key={step.title} className={`success-step ${i === 0 ? 'success-step--active' : ''}`}>
              <div className="success-step__icon">{step.icon}</div>
              <div className="success-step__info">
                <p className="success-step__title">{step.title}</p>
                <p className="success-step__desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="success-actions">
          <Link href={orderId ? `/order-tracking?orderId=${orderId}` : '/order-tracking'} className="btn btn--primary">
            Track This Order →
          </Link>
          <Link href="/products" className="btn btn--ghost">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="catalog-spinner" style={{ margin: '0 auto' }} />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
