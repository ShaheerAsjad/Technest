'use client';

import { useState } from 'react';

/** Coupon field: `applied` is what the server accepted, `error` is the server's message. */
export default function CouponBox({ applied, error, onApply, disabled }) {
  const [value, setValue] = useState('');
  return (
    <div className="coupon-box">
      {applied ? (
        <div className="coupon-box__applied">
          <span>🏷 <strong>{applied}</strong> applied</span>
          <button type="button" onClick={() => onApply('')}>Remove</button>
        </div>
      ) : (
        <form
          className="coupon-box__form"
          onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onApply(value); setValue(''); } }}
        >
          <input
            className="form-input"
            placeholder="Coupon code"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            maxLength={50}
            aria-label="Coupon code"
            disabled={disabled}
          />
          <button type="submit" className="btn btn--secondary" disabled={disabled || !value.trim()}>Apply</button>
        </form>
      )}
      {error && <p className="coupon-box__error">{error}</p>}
    </div>
  );
}
