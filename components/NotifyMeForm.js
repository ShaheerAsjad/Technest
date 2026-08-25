'use client';

import { useState } from 'react';

export default function NotifyMeForm({ productId, compact = false }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'loading' || status === 'done') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      });
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className="notify-form__success">✓ We&rsquo;ll email you when it&rsquo;s back.</p>;
  }

  return (
    <form
      className={`notify-form${compact ? ' notify-form--compact' : ''}`}
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-input notify-form__input"
      />
      <button type="submit" className="btn btn--secondary notify-form__btn" disabled={status === 'loading'}>
        {status === 'loading' ? '…' : 'Notify Me'}
      </button>
      {status === 'error' && <span className="notify-form__error">Try again</span>}
    </form>
  );
}
