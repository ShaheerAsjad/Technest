'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isValidEmail } from '@/lib/validators';
import { fetchJson } from '@/lib/client';

function B2BForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({ company: '', name: '', phone: '', email: '', items: params.get('product') || '', qty: '', message: '', website: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email address.');
    if (form.phone.replace(/[^0-9]/g, '').length < 10) return setError('Please enter a phone number we can reach you on.');
    if (form.items.trim().length < 2) return setError('Please tell us which products you need.');

    const message = [
      `B2B QUOTE REQUEST`,
      `Company: ${form.company || '-'}`,
      `Contact: ${form.name} · ${form.phone}`,
      `Products / SKUs: ${form.items}`,
      `Quantity: ${form.qty || '-'}`,
      form.message ? `Notes: ${form.message}` : '',
    ].filter(Boolean).join('\n');

    setBusy(true);
    const res = await fetchJson('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, subject: `B2B Quote Request${form.company ? ` — ${form.company}` : ''}`, message, website: form.website }),
    }, { timeout: 15000, retries: 0 });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.data?.error || 'Could not send your request. Please check your connection and try again.');
  }

  if (done) {
    return (
      <div className="contact-panel" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="contact-panel__success">
          <div className="contact-panel__success-icon">✓</div>
          <h2 className="contact-panel__success-title">Quote request received</h2>
          <p className="contact-panel__success-text">Thank you! Our team will review your requirement and get back to you shortly with the best rate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-panel" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="contact-panel__form">
        <h2 className="contact-panel__heading">Request a Bulk / B2B Quote</h2>
        {error && <div className="notice notice--error" role="alert">{error}</div>}
        <form className="contact-form" onSubmit={submit} noValidate>
          <div className="contact-form__row">
            <div className="contact-form__field">
              <label className="form-label" htmlFor="b-company">Company (optional)</label>
              <input id="b-company" className="form-input" value={form.company} onChange={set('company')} maxLength={120} />
            </div>
            <div className="contact-form__field">
              <label className="form-label" htmlFor="b-name">Your name</label>
              <input id="b-name" className="form-input" value={form.name} onChange={set('name')} maxLength={100} required />
            </div>
          </div>
          <div className="contact-form__row">
            <div className="contact-form__field">
              <label className="form-label" htmlFor="b-phone">Phone / WhatsApp</label>
              <input id="b-phone" type="tel" className="form-input" value={form.phone} onChange={set('phone')} maxLength={20} required />
            </div>
            <div className="contact-form__field">
              <label className="form-label" htmlFor="b-email">Email</label>
              <input id="b-email" type="email" className="form-input" value={form.email} onChange={set('email')} maxLength={150} required />
            </div>
          </div>
          <div className="contact-form__field">
            <label className="form-label" htmlFor="b-items">Products / SKUs needed</label>
            <textarea id="b-items" className="form-input form-textarea" rows={3} value={form.items} onChange={set('items')} maxLength={1000} placeholder="e.g. 50 × Huawei SFP 10G, 20 × Cat6 patch cord 3m" required />
          </div>
          <div className="contact-form__field">
            <label className="form-label" htmlFor="b-qty">Approximate quantity / budget (optional)</label>
            <input id="b-qty" className="form-input" value={form.qty} onChange={set('qty')} maxLength={120} />
          </div>
          <div className="contact-form__field">
            <label className="form-label" htmlFor="b-msg">Anything else? (optional)</label>
            <textarea id="b-msg" className="form-input form-textarea" rows={3} value={form.message} onChange={set('message')} maxLength={1500} />
          </div>
          {/* honeypot: real users never see / fill this */}
          <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
          <button type="submit" className="btn btn--primary contact-form__submit mt-4" disabled={busy}>
            {busy ? (<><span className="contact-form__spinner" aria-hidden="true" /> Sending...</>) : 'Send Quote Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function B2BPage() {
  return (
    <div className="container py-8">
      <div className="orders-header" style={{ textAlign: 'center', marginBottom: 24 }}>
        <span className="contact-page__eyebrow">Business customers</span>
        <h1 className="page-title">B2B &amp; Bulk Orders</h1>
        <p className="catalog-page__sub">Installers, ISPs, offices and resellers — tell us what you need and we will send a competitive quote.</p>
      </div>
      <Suspense fallback={<div className="catalog-spinner" style={{ margin: '40px auto' }} />}>
        <B2BForm />
      </Suspense>
    </div>
  );
}
