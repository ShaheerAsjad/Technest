'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '101';

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', background: '#fff', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '10px' }}>✔</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827' }}>Order Placed Successfully!</h1>
      <p style={{ color: '#6b7280', margin: '10px 0 20px 0' }}>
        Thank you for shopping with TechNest. Your order has been placed via Cash on Delivery.
      </p>

      <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
        <div style={{ fontWeight: '600', marginBottom: '5px' }}>Order Slip / Summary:</div>
        <div>Order Reference ID: <strong>#{orderId}</strong></div>
        <div>Payment Status: <strong>Pending (COD)</strong></div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
        <a 
          href={`/order-tracking?orderId=${orderId}`}
          style={{
            background: '#10b981', color: '#fff', padding: '10px 20px', 
            borderRadius: '8px', textDecoration: 'none', fontWeight: '600'
          }}
        >
          Track This Order
        </a>

        <a 
          href="/products" 
          style={{
            background: '#0070f3', color: '#fff', padding: '10px 20px', 
            borderRadius: '8px', textDecoration: 'none', fontWeight: '600'
          }}
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', padding: '50px' }}>Loading Order Slip...</p>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
