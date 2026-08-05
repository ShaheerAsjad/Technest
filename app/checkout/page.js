'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useApp,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
  EXPRESS_SHIPPING_COST,
} from '@/context/AppContext';
import { formatPrice } from '@/lib/format';
import { isRequired, isValidEmail, isValidZip } from '@/lib/validators';
import { validateCoupon, getDiscount } from '@/lib/coupons';
import Modal from '@/components/Modal';

export default function CheckoutPage() {
  const { cartDetailed, subtotal, clearCart, showToast } = useApp();

  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', zip: '' });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  const discount = getDiscount(appliedCoupon, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * TAX_RATE;
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : shippingMethod === 'express'
      ? EXPRESS_SHIPPING_COST
      : STANDARD_SHIPPING_COST;
  const total = taxable + tax + shippingCost;

  function handleApplyCoupon() {
    const coupon = validateCoupon(couponInput);
    if (coupon) {
      setAppliedCoupon(coupon);
      showToast(`Coupon applied: ${coupon.label}`);
    } else {
      showToast('Invalid coupon code', 'danger');
    }
  }

  function handlePlaceOrder() {
    if (!isRequired(form.name)) return setError('Please enter your full name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email.');
    if (!isRequired(form.address)) return setError('Please enter your address.');
    if (!isRequired(form.city)) return setError('Please enter your city.');
    if (!isValidZip(form.zip)) return setError('Please enter a valid ZIP code.');

    setError('');
    setOrderId(`TN-${Date.now().toString().slice(-8)}`);
  }

  function closeModalAndReset() {
    setOrderId(null);
    clearCart();
    setAppliedCoupon(null);
  }

  if (cartDetailed.length === 0 && !orderId) {
    return (
      <>
        <h1 className="page-title">Checkout</h1>
        <div className="empty-state">
          <p>Your cart is empty. Add products before checking out.</p>
          <Link href="/products" className="btn btn--primary">
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <div className="cart-layout">
        <div className="checkout-form">
          <h2 className="section-title">Shipping Details</h2>
          <input
            className="form-input"
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="form-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Street Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            className="form-input"
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="form-input"
            type="text"
            placeholder="ZIP Code"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
          />
          {error && <p className="form-error">{error}</p>}

          <h2 className="section-title">Shipping Method</h2>
          <div className="shipping-options">
            <label className="shipping-option">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === 'standard'}
                onChange={() => setShippingMethod('standard')}
              />
              <span>Standard — {formatPrice(STANDARD_SHIPPING_COST)}</span>
            </label>
            <label className="shipping-option">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === 'express'}
                onChange={() => setShippingMethod('express')}
              />
              <span>Express — {formatPrice(EXPRESS_SHIPPING_COST)}</span>
            </label>
          </div>

          <h2 className="section-title">Coupon</h2>
          <div className="coupon-row">
            <input
              className="form-input"
              type="text"
              placeholder="Coupon code (try SAVE10)"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <button className="btn btn--secondary" onClick={handleApplyCoupon}>
              Apply
            </button>
          </div>
        </div>

        <aside className="order-summary">
          <h2 className="section-title">Order Summary</h2>
          <div className="summary__row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="summary__row">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="summary__row">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="summary__row">
            <span>Shipping</span>
            <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
          </div>
          <div className="summary__row summary__row--total">
            <span>Total</span>
            <span className="summary__total-value">{formatPrice(total)}</span>
          </div>
          <button className="btn btn--primary summary__checkout-btn" onClick={handlePlaceOrder}>
            Place Order
          </button>
        </aside>
      </div>

      <Modal open={!!orderId} title="Order Confirmed 🎉" onClose={closeModalAndReset}>
        <p>Thank you, {form.name.split(' ')[0]}! Your order has been placed.</p>
        <p>
          Order ID: <strong>{orderId}</strong>
        </p>
        <p>
          Total Paid: <strong>{formatPrice(total)}</strong>
        </p>
        <Link href="/" className="btn btn--primary" onClick={closeModalAndReset}>
          Continue Shopping
        </Link>
      </Modal>
    </>
  );
}
