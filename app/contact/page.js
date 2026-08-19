'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isRequired, isValidEmail } from '@/lib/validators';

/* ── Contact info cards ── */
const CONTACT_INFO = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: 'Email',
    value: 'support@technest.store',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'Location',
    value: 'Karachi, Pakistan',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: 'Response Time',
    value: 'Within 24 hours',
  },
];

export default function ContactPage() {
  // ── Business logic — DO NOT MODIFY ────────────────────────────
  const { showToast } = useApp();
  const [form, setForm]         = useState({ name: '', email: '', message: '' });
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  async function handleSubmit() {
    if (!isRequired(form.name))    return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email.');
    if (!isRequired(form.message)) return setError('Please enter a message.');

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('https://formspree.io/f/maewevpj', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      if (response.ok) {
        showToast('Message sent! We will get back to you soon.');
        setForm({ name: '', email: '', message: '' });
        setSuccess(true);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="contact-page">
      {/* ── Page header ── */}
      <div className="contact-page__header">
        <div className="contact-page__header-inner">
          <span className="contact-page__eyebrow">Get in Touch</span>
          <h1 className="page-title contact-page__title">Contact Us</h1>
          <p className="contact-page__sub">
            Have a question, feedback, or need help with an order?<br />
            We&apos;re here for you — drop us a message below.
          </p>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="contact-page__body">

        {/* Left: Info cards */}
        <aside className="contact-page__info">
          {CONTACT_INFO.map((item) => (
            <div key={item.label} className="contact-info-card">
              <span className="contact-info-card__icon">{item.icon}</span>
              <div>
                <p className="contact-info-card__label">{item.label}</p>
                <p className="contact-info-card__value">{item.value}</p>
              </div>
            </div>
          ))}

          <div className="contact-info-note">
            <span className="contact-info-note__dot" />
            All communications are end-to-end secure and private.
          </div>
        </aside>

        {/* Right: Form panel */}
        <div className="contact-panel">
          {success ? (
            /* Success state */
            <div className="contact-panel__success">
              <div className="contact-panel__success-icon">✓</div>
              <h2 className="contact-panel__success-title">Message Sent!</h2>
              <p className="contact-panel__success-text">
                Thank you for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
              <button
                className="btn btn--ghost"
                onClick={() => setSuccess(false)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            /* Form */
            <div className="contact-panel__form">
              <h2 className="contact-panel__heading">Send a Message</h2>

              <div className="contact-form">
                <div className="contact-form__row">
                  <div className="contact-form__field">
                    <label className="form-label" htmlFor="contact-name">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      className="form-input"
                      type="text"
                      placeholder="e.g. Ali Hassan"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      autoComplete="name"
                    />
                  </div>

                  <div className="contact-form__field">
                    <label className="form-label" htmlFor="contact-email">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="contact-form__field">
                  <label className="form-label" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="form-input form-textarea"
                    placeholder="How can we help you today?"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                {error && (
                  <p className="form-error" role="alert">
                    ⚠ {error}
                  </p>
                )}

                <button
                  className="btn btn--primary contact-form__submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="contact-submit-btn"
                >
                  {submitting ? (
                    <>
                      <span className="contact-form__spinner" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    'Send Message →'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}