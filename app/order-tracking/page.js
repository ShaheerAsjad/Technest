'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch if orderId exists in URL
  useEffect(() => {
    if (initialOrderId) {
      fetchOrderStatus(initialOrderId);
    }
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

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
        Track Your Order & Parcel
      </h1>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Enter Order ID (e.g. 1)" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
        />
        <button 
          onClick={() => fetchOrderStatus()}
          disabled={loading}
          style={{ padding: '12px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: '20px', fontWeight: '500' }}>{error}</div>}

      {/* Order Details & Timeline */}
      {orderData && (
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px' }}>
            <div>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Order ID:</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#{orderData.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Payment Status:</span>
              <div style={{ color: '#d97706', fontWeight: 'bold' }}>{orderData.payment_method || 'Cash on Delivery'} (Pending)</div>
            </div>
          </div>

          {/* Progress Timeline */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>Delivery Progress</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
            {['Order Placed', 'Packed', 'Shipped', 'Delivered'].map((step, index) => {
              const currentStatus = orderData.status || 'Order Placed';
              const isCurrent = currentStatus === step || (index === 0 && !orderData.status);
              return (
                <div key={index} style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', background: isCurrent ? '#10b981' : '#e5e7eb', 
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontWeight: 'bold', fontSize: '0.85rem' 
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: isCurrent ? '#111827' : '#9ca3af', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Parcel Items List */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>Parcel Details (Items)</h3>
          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            {Array.isArray(orderData.items) && orderData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{item.name || item.title || 'Product'} (x{item.quantity || 1})</span>
                <span style={{ fontWeight: '600' }}>${item.price}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total Amount:</span>
              <span style={{ color: '#0070f3' }}>${orderData.total_amount}</span>
            </div>
          </div>

          <div>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Delivery Address:</span>
            <div style={{ fontWeight: '500' }}>{orderData.address}, {orderData.city}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading Order Tracker...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
