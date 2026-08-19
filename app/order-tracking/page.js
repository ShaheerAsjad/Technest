'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const TRACKING_STEPS = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];

const STEP_ICONS = {
  'Order Placed': '📋',
  'Packed':       '📦',
  'Shipped':      '🚚',
  'Delivered':    '✅',
};

function OrderTrackingContent() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderId) {
      fetchOrderStatus(initialOrderId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  const fetchOrderStatus = async (idToFetch) => {
    const id = idToFetch || orderId;
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (res.ok) {
        setOrderData(data);
      } else {
        setError(data.error || 'Order not found');
        setOrderData(null);
      }
    } catch (err) {
      console.error('Order tracking fetch error:', err);
      setError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────

  const currentStatus = orderData?.status || 'Order Placed';
  const currentStepIndex = TRACKING_STEPS.indexOf(currentStatus);

  return (
    <div className="container py-8">
      <div className="orders-header">
        <h1 className="page-title">Track Your Order</h1>
        <p className="catalog-page__sub">Enter your Order ID to see real-time delivery status.</p>
      </div>

      {/* Search Bar */}
      <div className="tracking-search mt-6">
        <div className="catalog-search-wrap" style={{ maxWidth: '460px' }}>
          <svg className="catalog-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="form-input catalog-search"
            placeholder="Enter Order ID (e.g. 42)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrderStatus()}
          />
        </div>
        <button
          className="btn btn--primary"
          onClick={() => fetchOrderStatus()}
          disabled={loading}
          style={{ padding: '12px 24px' }}
        >
          {loading ? (
            <>
              <span className="contact-form__spinner" aria-hidden="true" />
              Searching…
            </>
          ) : 'Track'}
        </button>
      </div>

      {error && (
        <div className="tracking-error mt-4">
          ⚠ {error}
        </div>
      )}

      {/* Order Result Panel */}
      {orderData && (
        <div className="tracking-panel mt-6">

          {/* Header */}
          <div className="tracking-panel__header">
            <div>
              <span className="order-card__label">Order ID</span>
              <h2 className="order-card__id" style={{ fontSize: '1.4rem' }}>#{orderData.id}</h2>
            </div>
            <div className="tracking-panel__payment">
              <span className="order-card__label">Payment</span>
              <span className="tracking-panel__cod">{orderData.payment_method || 'Cash on Delivery'} — Pending</span>
            </div>
          </div>

          {/* Progress Timeline */}
          <h3 className="tracking-section-title">Delivery Progress</h3>
          <div className="tracking-steps">
            {TRACKING_STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div
                  key={step}
                  className={`tracking-step ${isCurrent ? 'tracking-step--active' : ''} ${isComplete ? 'tracking-step--done' : ''}`}
                >
                  <div className="tracking-step__circle">
                    <span className="tracking-step__icon">
                      {isComplete ? '✓' : STEP_ICONS[step]}
                    </span>
                    {index < TRACKING_STEPS.length - 1 && (
                      <div className={`tracking-step__line ${isComplete ? 'tracking-step__line--done' : ''}`} />
                    )}
                  </div>
                  <span className="tracking-step__label">{step}</span>
                </div>
              );
            })}
          </div>

          {/* Parcel Items */}
          <h3 className="tracking-section-title mt-6">Parcel Contents</h3>
          <div className="tracking-items">
            {Array.isArray(orderData.items) && orderData.items.map((item, idx) => (
              <div key={idx} className="order-card__item-row">
                <span>{item.name || item.title || 'Product'} <span className="order-card__qty">× {item.quantity || 1}</span></span>
                <span className="order-card__item-price">${Number(item.price).toFixed(2)}</span>
              </div>
            ))}
            <div className="tracking-items__total">
              <span>Total Amount</span>
              <span className="checkout-total-val">${Number(orderData.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="tracking-address mt-4">
            <span className="order-card__label">Delivery Address</span>
            <p className="tracking-address__value">{orderData.address}, {orderData.city}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="catalog-spinner" style={{ margin: '0 auto' }} />
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
