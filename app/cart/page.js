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
      <div className="cart-page">
        <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
          <p className="catalog-loading-text">Loading Cart…</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container py-8">
          <div className="catalog-empty">
            <h1 className="page-title mb-4">Your Cart</h1>
            <p className="catalog-empty__text mb-6">Your cart is currently empty.</p>
            <Link href="/products" className="btn btn--primary">
              Continue Shopping →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container py-8">
        <h1 className="page-title mb-6">Your Cart</h1>

        <div className="cart-layout">
          {/* ── Cart Items List ── */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="cart-item__img" />
                </div>

                <div className="cart-item__details">
                  <h3 className="cart-item__title">{item.name}</h3>
                  <p className="cart-item__price">{formatPrice(item.price)}</p>
                </div>

                <div className="cart-qty-ctrl">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    disabled={item.quantity >= (item.stock || 99)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item__total">
                  {formatPrice(item.price * item.quantity)}
                </div>

                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => handleRemove(item)}
                  aria-label="Remove item"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* ── Order Summary ── */}
          <div className="cart-summary-panel">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Tax (5%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className="cart-summary__free">Free</span>
              </div>
            </div>

            <div className="cart-summary__total-row">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link href="/checkout" style={{ textDecoration: 'none', display: 'block' }}>
              <button className="btn btn--primary cart-summary__btn">
                Proceed to Checkout →
              </button>
            </Link>
            
            <div className="cart-summary__secure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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