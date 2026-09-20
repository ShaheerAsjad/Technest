'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useApp } from '@/context/AppContext';
import { useCartQuote } from '@/lib/useCartQuote';
import { useCoupon } from '@/lib/useCoupon';
import { fetchJson, newIdempotencyKey } from '@/lib/client';
import { formatPrice } from '@/lib/format';
import { normalizePkPhone } from '@/lib/validators';
import CouponBox from '@/components/CouponBox';
import OrderSummaryRows from '@/components/OrderSummaryRows';

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const { cart, mounted, clearCart } = useApp();
  const [coupon, applyCoupon] = useCoupon();

  const [showAlert, setShowAlert] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [payment, setPayment] = useState('cod');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const idemKey = useRef(null);
  const errorRef = useRef(null);

  // Delay the city -> shipping recalculation while the customer is still typing
  const [cityForQuote, setCityForQuote] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setCityForQuote(form.city.trim()), 500);
    return () => clearTimeout(t);
  }, [form.city]);

  const quote = useCartQuote({ city: cityForQuote, coupon, paymentMethod: payment, enabled: isLoaded && isSignedIn });
  const { lines, pricing, settings, problems, loading: quoting, error: quoteError } = quote;

  useEffect(() => { if (!idemKey.current) idemKey.current = newIdempotencyKey(); }, []);

  // Pre-fill the name from the signed-in account (only if still empty)
  useEffect(() => {
    if (user && !form.name) {
      const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
      if (full) setForm((f) => ({ ...f, name: full }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Make sure the selected payment method is actually enabled
  useEffect(() => {
    if (!settings) return;
    const p = settings.payment;
    if (payment === 'cod' && !p.codEnabled && p.bankTransferEnabled) setPayment('bank');
    if (payment === 'bank' && !p.bankTransferEnabled && p.codEnabled) setPayment('cod');
  }, [settings, payment]);

  const cityOptions = useMemo(
    () => [...new Set((settings?.shipping?.zones || []).flatMap((z) => z.cities || []))].slice(0, 80),
    [settings]
  );

  const phoneValue = normalizePkPhone(form.phone);
  const noPaymentMethod = settings && !settings.payment.codEnabled && !settings.payment.bankTransferEnabled;

  const canSubmit =
    !submitting && !quoting && lines.length > 0 && problems.length === 0 && pricing && !pricing.couponError && !pricing.minOrderProblem && !noPaymentMethod;

  function fail(message) {
    setError(message);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneTouched(true);

    if (form.name.trim().length < 2) return fail('Please enter your full name.');
    if (!phoneValue) return fail('Please enter a valid 11-digit Pakistani mobile number starting with 03 (e.g. 03001234567).');
    if (form.address.trim().length < 6) return fail('Please enter your full delivery address.');
    if (form.city.trim().length < 2) return fail('Please enter your city.');
    if (!canSubmit) return fail('Please review your cart before placing the order.');

    setSubmitting(true);
    const res = await fetchJson(
      '/api/checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: phoneValue,
          address: form.address,
          city: form.city,
          notes: form.notes,
          paymentMethod: payment,
          coupon,
          items: cart.map((i) => ({ id: i.productId, quantity: i.quantity })),
          idempotencyKey: idemKey.current,
        }),
      },
      { timeout: 25000, retries: 0 }
    );
    setSubmitting(false);

    if (res.ok && res.data?.orderId) {
      clearCart();
      applyCoupon('');
      window.dispatchEvent(new CustomEvent('technest:route-start', { detail: { full: true } }));
      router.push(`/order-success?orderId=${res.data.orderId}`);
      return;
    }
    if (res.status === 0) return fail('Network problem - your order was NOT placed. Please check your internet and try again.');
    if (res.status === 401) return fail('Your session expired. Please sign in again.');
    fail(res.data?.error || 'We could not place your order. Please try again.');
  };

  if (!isLoaded || !mounted) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div className="catalog-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
        <p className="catalog-loading-text">Loading Checkout...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-8">
        <div className="catalog-empty">
          <h1 className="page-title mb-4">Checkout</h1>
          <p className="catalog-empty__text mb-6">Your cart is empty.</p>
          <Link href="/products" className="btn btn--primary">Continue Shopping →</Link>
        </div>
      </div>
    );
  }

  // Access guard (unauthenticated users)
  if (!isSignedIn && showAlert) {
    return (
      <div className="checkout-auth-guard">
        <div className="checkout-auth-panel">
          <div className="checkout-auth-glow" aria-hidden="true" />
          <button className="checkout-auth-close" onClick={() => setShowAlert(false)} aria-label="Close">&times;</button>
          <div className="checkout-auth-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="checkout-auth-title">Sign in to continue</h2>
          <p className="checkout-auth-text">
            To keep your order secure and let you track it, please sign in or create an account before checkout. Your cart will be waiting.
          </p>
          <SignInButton mode="modal">
            <button className="btn btn--primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Sign In to Continue</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '50vh' }}>
        <h1 className="page-title mb-4">Sign in required</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>You need to be signed in to place an order.</p>
        <SignInButton mode="modal"><button className="btn btn--primary">Sign In</button></SignInButton>
      </div>
    );
  }

  const phoneRaw = form.phone || '';
  const phoneMsg = !phoneTouched && !phoneRaw ? null
    : !phoneRaw.trim() ? { ok: false, text: 'Phone number is required' }
    : /[a-zA-Z]/.test(phoneRaw) ? { ok: false, text: 'Numbers only, please.' }
    : !phoneValue ? { ok: false, text: 'Must be an 11-digit Pakistani number starting with 03 (e.g. 03001234567)' }
    : { ok: true, text: 'Valid Pakistani phone number' };

  const p = settings?.payment;

  return (
    <div className="checkout-page">
      <div className="container py-8">
        <div className="checkout-header">
          <h1 className="page-title">Secure Checkout</h1>
          <p className="catalog-page__sub">Complete your order details below.</p>
        </div>

        <div className="checkout-layout">
          {/* Left: form */}
          <div className="checkout-panel">
            <h2 className="checkout-panel__heading">Shipping Details</h2>

            {error && <div className="notice notice--error" role="alert" ref={errorRef}>{error}</div>}
            {quoteError && <div className="notice notice--error" role="alert">{quoteError}</div>}
            {problems.length > 0 && <div className="notice notice--warn" role="alert">{problems[0].message} <Link href="/cart" className="notice__btn">Review cart</Link></div>}

            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              <div className="contact-form__row">
                <div className="contact-form__field">
                  <label className="form-label" htmlFor="co-name">Full Name</label>
                  <input id="co-name" type="text" required className="form-input" placeholder="Ali Hassan" autoComplete="name" maxLength={100}
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                <div className="contact-form__field">
                  <label className="form-label" htmlFor="co-phone">Phone Number (03XXXXXXXXX)</label>
                  <input id="co-phone" type="tel" required className="form-input" placeholder="03001234567" maxLength={14} autoComplete="tel"
                    value={form.phone}
                    onBlur={() => setPhoneTouched(true)}
                    onChange={(e) => { setPhoneTouched(true); setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9+]/g, '') })); }} />
                  {phoneMsg && <span className={`field-msg ${phoneMsg.ok ? 'field-msg--ok' : 'field-msg--err'}`}>{phoneMsg.ok ? '✓' : '⚠'} {phoneMsg.text}</span>}
                </div>
              </div>

              <div className="contact-form__field">
                <label className="form-label" htmlFor="co-address">Delivery Address</label>
                <textarea id="co-address" required className="form-input form-textarea" placeholder="House / shop no., street, area" rows={3} maxLength={300} autoComplete="street-address"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="contact-form__field">
                <label className="form-label" htmlFor="co-city">City</label>
                <input id="co-city" type="text" required className="form-input" placeholder="Lahore" maxLength={60} list="co-cities" autoComplete="address-level2"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                {cityOptions.length > 0 && (
                  <datalist id="co-cities">{cityOptions.map((c) => <option key={c} value={c.charAt(0).toUpperCase() + c.slice(1)} />)}</datalist>
                )}
                {pricing?.zoneName && <span className="field-msg field-msg--ok">✓ Delivery zone: {pricing.zoneName}{pricing.eta ? ` · ${pricing.eta}` : ''}</span>}
              </div>

              <div className="contact-form__field">
                <label className="form-label" htmlFor="co-notes">Order notes (optional)</label>
                <input id="co-notes" type="text" className="form-input" placeholder="Landmark, preferred delivery time…" maxLength={500}
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="checkout-payment-box mt-4">
                <div className="checkout-payment-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span>Payment Method</span>
                </div>
                {(!p || p.codEnabled) && (
                  <label className="checkout-payment-method" htmlFor="pay-cod">
                    <input type="radio" name="payment" id="pay-cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
                    <span>Cash on Delivery (COD){p?.codFee > 0 ? ` — fee ${formatPrice(p.codFee)}` : ''}</span>
                  </label>
                )}
                {p?.bankTransferEnabled && (
                  <label className="checkout-payment-method" htmlFor="pay-bank">
                    <input type="radio" name="payment" id="pay-bank" checked={payment === 'bank'} onChange={() => setPayment('bank')} />
                    <span>Bank Transfer</span>
                  </label>
                )}
                {payment === 'bank' && p?.bankInstructions && <p className="checkout-bank-note">{p.bankInstructions}</p>}
                {noPaymentMethod && <p className="coupon-box__error">No payment method is enabled right now. Please contact the store.</p>}
              </div>

              <button type="submit" className="btn btn--primary contact-form__submit mt-6" disabled={!canSubmit}>
                {submitting ? (<><span className="contact-form__spinner" aria-hidden="true" /> Processing...</>) : 'Confirm & Place Order'}
              </button>
              <p className="checkout-terms">By placing your order you agree to our <Link href="/terms">Terms</Link> and <Link href="/return-policy">Return Policy</Link>.</p>
            </form>
          </div>

          {/* Right: summary */}
          <div className="checkout-summary">
            <h2 className="cart-summary__title">Order Review</h2>

            <div className="checkout-summary__items">
              {lines.map((item) => (
                <div key={item.id} className="checkout-summary__item">
                  <div className="checkout-summary__item-info">
                    <span className="checkout-summary__item-qty">{item.quantity}x</span>
                    <span className="checkout-summary__item-name">{item.name}</span>
                  </div>
                  <span className="checkout-summary__item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              {quoting && lines.length === 0 && <p className="cart-summary__note">Loading your items…</p>}
            </div>

            <CouponBox applied={pricing?.couponCode} error={pricing?.couponError} onApply={applyCoupon} disabled={quoting} />
            <div className="mt-4">{pricing && <OrderSummaryRows pricing={pricing} />}</div>
            {pricing?.minOrderProblem && <p className="coupon-box__error">{pricing.minOrderProblem}</p>}

            <div className="cart-summary__secure mt-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Prices are verified securely on our server
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
