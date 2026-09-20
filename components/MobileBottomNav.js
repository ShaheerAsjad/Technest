'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useApp } from '@/context/AppContext';

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

/** Phone-only bottom tab bar: Home / Shop / Wishlist / Cart / Account. */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlistCount, openCart } = useApp();
  const { isSignedIn } = useUser();

  if (pathname?.startsWith('/admin')) return null;

  const active = (p) => (p === '/' ? pathname === '/' : pathname?.startsWith(p));
  const onCartPage = pathname === '/cart' || pathname === '/checkout';

  return (
    <nav className="bottomnav" aria-label="Quick navigation">
      <Link href="/" className={`bottomnav__item${active('/') ? ' bottomnav__item--active' : ''}`}>
        <svg {...svg}><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
        <span>Home</span>
      </Link>
      <button type="button" className="bottomnav__item" onClick={() => window.dispatchEvent(new Event('technest:open-categories'))}>
        <svg {...svg}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        <span>Shop</span>
      </button>
      <Link href="/wishlist" className={`bottomnav__item${active('/wishlist') ? ' bottomnav__item--active' : ''}`}>
        <span className="bottomnav__icon">
          <svg {...svg}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          {wishlistCount > 0 && <b className="bottomnav__badge">{wishlistCount}</b>}
        </span>
        <span>Wishlist</span>
      </Link>
      {onCartPage ? (
        <Link href="/cart" className={`bottomnav__item${active('/cart') ? ' bottomnav__item--active' : ''}`}>
          <span className="bottomnav__icon">
            <svg {...svg}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            {cartCount > 0 && <b className="bottomnav__badge">{cartCount}</b>}
          </span>
          <span>Cart</span>
        </Link>
      ) : (
        <button type="button" className="bottomnav__item" onClick={openCart}>
          <span className="bottomnav__icon">
            <svg {...svg}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            {cartCount > 0 && <b className="bottomnav__badge">{cartCount}</b>}
          </span>
          <span>Cart</span>
        </button>
      )}
      <Link href={isSignedIn ? '/my-orders' : '/sign-in'} className={`bottomnav__item${active('/my-orders') || active('/sign-in') ? ' bottomnav__item--active' : ''}`}>
        <svg {...svg}><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
        <span>{isSignedIn ? 'Orders' : 'Sign in'}</span>
      </Link>
    </nav>
  );
}
