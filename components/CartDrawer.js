'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useCartQuote } from '@/lib/useCartQuote';
import { formatPrice } from '@/lib/format';
import SafeImage from './SafeImage';

/** Slide-in mini cart (opens from the navbar / bottom bar cart button). */
export default function CartDrawer() {
  const pathname = usePathname();
  const { cartOpen, closeCart, updateQuantity, removeFromCart, cart } = useApp();
  const quote = useCartQuote({ enabled: cartOpen });

  useEffect(() => { closeCart(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cartOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [cartOpen, closeCart]);

  if (!cartOpen) return null;

  const p = quote.pricing;
  const threshold = quote.settings?.shipping?.freeThreshold || 0;
  const showBar = quote.settings?.shipping?.freeEnabled && threshold > 0 && p;
  const progress = showBar ? Math.min(100, Math.round((p.taxable / threshold) * 100)) : 0;
  const empty = cart.length === 0;

  return (
    <div className="cartdrawer" role="dialog" aria-modal="true" aria-label="Your cart">
      <div className="cartdrawer__backdrop" onClick={closeCart} />
      <aside className="cartdrawer__panel">
        <div className="cartdrawer__head">
          <span>Your Cart {cart.length > 0 && <small>({cart.reduce((s, i) => s + i.quantity, 0)})</small>}</span>
          <button type="button" onClick={closeCart} aria-label="Close cart">&times;</button>
        </div>

        {empty ? (
          <div className="cartdrawer__empty">
            <p>Your cart is empty.</p>
            <Link href="/products" className="btn btn--primary" onClick={closeCart}>Browse products</Link>
          </div>
        ) : (
          <>
            {showBar && (
              <div className="cartdrawer__progress">
                <p>
                  {p.shippingFree && p.freeReason === 'threshold'
                    ? '🎉 You have unlocked free shipping!'
                    : p.freeShippingRemaining > 0
                      ? `Add ${formatPrice(p.freeShippingRemaining)} more for free shipping`
                      : ''}
                </p>
                <div className="cartdrawer__bar"><span style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            <div className="cartdrawer__body">
              {quote.loading && quote.lines.length === 0 && <p className="cartdrawer__note">Loading your items…</p>}
              {quote.error && <p className="cartdrawer__note cartdrawer__note--err">{quote.error}</p>}
              {quote.problems.length > 0 && (
                <div className="cartdrawer__note cartdrawer__note--err">
                  {quote.problems[0].message}
                  <button type="button" className="cartdrawer__link" onClick={() => quote.problems.forEach((pr) => removeFromCart(pr.id))}>Remove unavailable items</button>
                </div>
              )}
              {quote.lines.map((l) => (
                <div key={l.id} className="cartdrawer__item">
                  <Link href={`/products/${l.slug || l.id}`} onClick={closeCart} className="cartdrawer__img">
                    <SafeImage src={l.image} alt={l.name} />
                  </Link>
                  <div className="cartdrawer__info">
                    <Link href={`/products/${l.slug || l.id}`} onClick={closeCart} className="cartdrawer__name">{l.name}</Link>
                    <span className="cartdrawer__price">{formatPrice(l.price)}</span>
                    <div className="cart-qty-ctrl cartdrawer__qty">
                      <button type="button" className="cart-qty-btn" onClick={() => updateQuantity(l.id, l.quantity - 1)} aria-label="Decrease quantity">-</button>
                      <span className="cart-qty-value">{l.quantity}</span>
                      <button type="button" className="cart-qty-btn" onClick={() => updateQuantity(l.id, l.quantity + 1)} disabled={l.quantity >= l.stock} aria-label="Increase quantity">+</button>
                    </div>
                  </div>
                  <button type="button" className="cartdrawer__remove" onClick={() => removeFromCart(l.id)} aria-label={`Remove ${l.name}`}>&times;</button>
                </div>
              ))}
            </div>

            <div className="cartdrawer__foot">
              <div className="cartdrawer__row"><span>Subtotal</span><strong>{p ? formatPrice(p.subtotal) : '—'}</strong></div>
              <p className="cartdrawer__hint">Shipping{p?.taxEnabled ? ' and tax' : ''} are calculated at checkout.</p>
              <Link href="/checkout" className="btn btn--primary cartdrawer__cta" onClick={closeCart}>Checkout</Link>
              <Link href="/cart" className="btn btn--ghost cartdrawer__cta" onClick={closeCart}>View full cart</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
