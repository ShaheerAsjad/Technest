'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const STEPS = [
  { icon: '📋', title: 'Order Placed', desc: 'Your order has been confirmed.' },
  { icon: '📦', title: 'Being Packed', desc: 'We are preparing your items.' },
  { icon: '🚚', title: 'Out for Delivery', desc: 'Your parcel is on the way.' },
  { icon: '✅', title: 'Delivered', desc: 'Enjoy your new tech!' },
];

function OrderSuccessContent() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '101';
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
          Thank you for shopping with TechNest. Your order has been confirmed via Cash on Delivery.
        </p>

        {/* Order Slip */}
        <div className="success-slip">
          <div className="success-slip__row">
            <span className="success-slip__label">Order ID</span>
            <span className="success-slip__value">#{orderId}</span>
          </div>
          <div className="success-slip__row">
            <span className="success-slip__label">Payment Method</span>
            <span className="success-slip__value">Cash on Delivery</span>
          </div>
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
          <Link href={`/order-tracking?orderId=${orderId}`} className="btn btn--primary">
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
