'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { fetchJson } from './client';

const EMPTY = { loading: true, lines: [], pricing: null, settings: null, problems: [], warnings: [], error: '' };

/**
 * Asks the SERVER for the cart's lines + price breakdown (real prices, stock, shipping, tax, coupon).
 * Used by the cart page, the cart drawer and the checkout page.
 */
export function useCartQuote({ city = '', coupon = '', paymentMethod = 'cod', enabled = true } = {}) {
  const { cart, mounted } = useApp();
  const [state, setState] = useState(EMPTY);

  const items = useMemo(() => cart.map((i) => ({ id: i.productId, quantity: i.quantity })), [cart]);
  const key = JSON.stringify([items, city, coupon, paymentMethod]);

  useEffect(() => {
    if (!enabled || !mounted) return undefined;
    if (items.length === 0) {
      setState({ ...EMPTY, loading: false });
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: '' }));
      const res = await fetchJson(
        '/api/pricing/quote',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, city, coupon, paymentMethod }),
          signal: controller.signal,
        },
        { timeout: 15000, retries: 1 }
      );
      if (cancelled) return;
      if (res.ok && res.data) {
        setState({
          loading: false,
          lines: res.data.lines || [],
          pricing: res.data.pricing || null,
          settings: res.data.settings || null,
          problems: res.data.problems || [],
          warnings: res.data.warnings || [],
          error: '',
        });
      } else {
        setState((s) => ({
          ...s,
          loading: false,
          error: res.data?.error || 'Could not load your cart. Please check your connection and try again.',
        }));
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, mounted]);

  return state;
}
