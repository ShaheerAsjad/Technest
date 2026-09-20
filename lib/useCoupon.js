'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'technest_coupon';

/** Remembers the applied coupon code between the cart page and checkout (per browser tab). */
export function useCoupon() {
  const [code, setCode] = useState('');
  useEffect(() => {
    try { setCode(sessionStorage.getItem(KEY) || ''); } catch { /* ignore */ }
  }, []);
  const apply = useCallback((value) => {
    const v = String(value || '').trim().toUpperCase().slice(0, 50);
    setCode(v);
    try { if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);
  return [code, apply];
}
