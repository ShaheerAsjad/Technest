'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useUser, SignInButton } from '@clerk/nextjs';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { cart = [], clearCart } = useApp();

  const [showAlert, setShowAlert] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Checkout Products Fetch Error:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // Map real cart items with product details
  const cartItems = cart
    .map((item) => {
      const targetId = String(item.id || item.productId);
      const prod = products.find((p) => String(p.id) === targetId);
      return prod ? { id: prod.id, name: prod.name || prod.title, price: prod.price, quantity: item.quantity || 1 } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const totalAmount = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (cartItems.length === 0) {
      alert('Your cart is empty! Please add products to cart before checking out.');
      return;
    }

    const rawPhone = formData.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const hasInvalidChars = /[^0-9+]/.test(rawPhone);
    const isValidPakPhone = !hasInvalidChars && (
      (cleanPhone.length === 11 && cleanPhone.startsWith('03')) ||
      (cleanPhone.length === 12 && cleanPhone.startsWith('923'))
    );

    if (!isValidPakPhone) {
      alert('Please enter a valid 11-digit Pakistani phone number starting with 03 (e.g. 03001234567). Only digits are allowed.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cartItems,
          totalAmount
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (typeof clearCart === 'function') {
          clearCart();
        }
        router.push(`/order-success?orderId=${data.orderId}`);
      } else {
        alert('Error: ' + (data.error || 'Failed to place order'));
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loadingProducts) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <p className="catalog-loading-text">Loading Checkout…</p>
      </div>
    );
  }

  // Access Denied Modal (for unauthenticated users)
  if (!isSignedIn && showAlert) {
    return (
      <div className="checkout-auth-guard">
        <div className="checkout-auth-panel">
          <div className="checkout-auth-glow" aria-hidden="true" />
          <button 
            className="checkout-auth-close"
            onClick={() => setShowAlert(false)}
            aria-label="Close"
          >
            &times;
          </button>

          <div className="checkout-auth-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          
          <h2 className="checkout-auth-title">Authentication Required</h2>
          <p className="checkout-auth-text">
            To ensure your order is processed securely and can be tracked, please sign in or create an account before proceeding to checkout.
          </p>

          <SignInButton mode="modal">
            <button className="btn btn--primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container py-8">
        
        <div className="checkout-header">
          <h1 className="page-title">Secure Checkout</h1>
          <p className="catalog-page__sub">Complete your order details below.</p>
        </div>

        <div className="checkout-layout">
          {/* Left: Checkout Form */}
          <div className="checkout-panel">
            <h2 className="checkout-panel__heading">Shipping Details</h2>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form__row">
                <div className="contact-form__field">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" required 
                    className="form-input"
                    placeholder="Ali Hassan"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="contact-form__field">
                  <label className="form-label">Phone Number (Pakistani Format: 03XXXXXXXXX)</label>
                  <input 
                    type="tel" required 
                    className="form-input"
                    placeholder="03001234567"
                    maxLength={13}
                    value={formData.phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => {
                      setPhoneTouched(true);
                      // Only allow digits and leading plus sign
                      const inputVal = e.target.value;
                      const sanitized = inputVal.replace(/[^0-9+]/g, '');
                      setFormData(prev => ({ ...prev, phone: sanitized }));
                    }}
                  />
                  {(phoneTouched || formData.phone) && (() => {
                    const raw = formData.phone || '';
                    const clean = raw.replace(/[^0-9]/g, '');
                    const hasAlphabets = /[a-zA-Z]/.test(raw);
                    const isPakFormat = (clean.length === 11 && clean.startsWith('03')) || (clean.length === 12 && clean.startsWith('923'));

                    if (!raw.trim()) {
                      return (
                        <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⚠ Phone number is required
                        </span>
                      );
                    }

                    if (hasAlphabets) {
                      return (
                        <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⚠ Alphabets not allowed! Please enter numbers only.
                        </span>
                      );
                    }

                    if (!isPakFormat) {
                      return (
                        <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⚠ Must be an 11-digit Pakistani number starting with 03 (e.g. 03001234567)
                        </span>
                      );
                    }

                    return (
                      <span style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ✓ Valid Pakistani phone number
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="contact-form__field">
                <label className="form-label">Delivery Address</label>
                <textarea required 
                  className="form-input form-textarea"
                  placeholder="Street address, apartment, suite, etc."
                  rows={3}
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="contact-form__field">
                <label className="form-label">City</label>
                <input 
                  type="text" required 
                  className="form-input"
                  placeholder="Karachi"
                  value={formData.city} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>

              <div className="checkout-payment-box mt-4">
                <div className="checkout-payment-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span>Payment Method</span>
                </div>
                <div className="checkout-payment-method">
                  <input type="radio" checked readOnly id="cod" />
                  <label htmlFor="cod">Cash on Delivery (COD)</label>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn--primary contact-form__submit mt-6"
                disabled={loading || loadingProducts || cartItems.length === 0}
              >
                {loading ? (
                  <>
                    <span className="contact-form__spinner" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Place Order'
                )}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary">
            <h2 className="cart-summary__title">Order Review</h2>
            
            <div className="checkout-summary__items">
              {cartItems.map((item) => (
                <div key={item.id} className="checkout-summary__item">
                  <div className="checkout-summary__item-info">
                    <span className="checkout-summary__item-qty">{item.quantity}×</span>
                    <span className="checkout-summary__item-name">{item.name}</span>
                  </div>
                  <span className="checkout-summary__item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="cart-summary__rows mt-4">
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
              <span className="checkout-total-val">{formatPrice(totalAmount)}</span>
            </div>
            
            <div className="cart-summary__secure mt-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Information is encrypted & secure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
