'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Cart Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const cartItems = cart
    .map((item) => {
      const rawId = item.id || item.productId;
      const targetId = String(rawId);
      const prod = products.find((p) => String(p.id) === targetId);
      return prod ? { ...prod, quantity: item.quantity || 1, cartRawId: rawId } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleRemove = (item) => {
    removeFromCart(item.cartRawId);
    removeFromCart(item.id);
  };

  const handleQuantityChange = (item, newQty) => {
    if (newQty <= 0) {
      handleRemove(item);
    } else {
      updateQuantity(item.cartRawId, newQty);
      updateQuantity(item.id, newQty);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="page-title mb-6">Your Cart</h1>
        <p>Loading Cart…</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="page-title mb-4">Your Cart</h1>
        <p className="mb-6">Your cart is currently empty.</p>
        <Link href="/products" className="btn btn--primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="page-title mb-6">Your Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1rem',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f9fafb' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 4px 0' }}>{item.name}</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{formatPrice(item.price)}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
                >
                  −
                </button>
                <span style={{ width: '24px', textAlign: 'center', fontWeight: '500' }}>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
                >
                  +
                </button>
              </div>

              <div style={{ fontWeight: '700', width: '90px', textAlign: 'right' }}>
                {formatPrice(item.price * item.quantity)}
              </div>

              <button
                type="button"
                onClick={() => handleRemove(item)}
                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '500', marginLeft: '0.5rem' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary Box */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem' }}>Order Summary</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.95rem', color: '#4b5563' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping</span>
              <span>Free</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.15rem' }}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {/* Proceed to Checkout Button */}
          <Link href="/checkout" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
            <button
              style={{
                width: '100%',
                backgroundColor: '#0070f3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
            >
              Proceed to Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}