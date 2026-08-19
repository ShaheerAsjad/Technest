'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

/* ─── Inline SVG icons ─── */
function IconCart({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconHeart({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function IconSun({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IconMoon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar() {
  const { cartCount, wishlistCount, theme, toggleTheme } = useApp();
  const { isSignedIn, isLoaded } = useUser();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [bounce,   setBounce]     = useState(false);
  const prevCount = useRef(cartCount);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Cart badge bounce */
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 420);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  /* Close mobile menu on viewport expand */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 767) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      {/* ── Logo ── */}
      <Link href="/" className="navbar__logo" onClick={closeMenu}>
        <span className="navbar__logo-dot" aria-hidden="true" />
        <span className="logo-tech">Tech</span>
        <span className="logo-nest">Nest</span>
      </Link>

      {/* ── Desktop Links ── */}
      <div className="navbar__links">
        <Link href="/"              className="navbar__link">Home</Link>
        <Link href="/products"      className="navbar__link">Products</Link>
        <Link href="/my-orders"     className="navbar__link">My Orders</Link>
        <Link href="/order-tracking" className="navbar__link navbar__link--track">Track Order</Link>
        <Link href="/about"         className="navbar__link">About</Link>
        <Link href="/contact"       className="navbar__link">Contact</Link>
      </div>

      {/* ── Right Actions ── */}
      <div className="navbar__actions">
        {/* Hamburger */}
        <button
          className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Theme toggle */}
        <button className="navbar__theme-btn" onClick={toggleTheme} aria-label="Toggle colour mode">
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>

        {/* Wishlist */}
        <Link href="/wishlist" className="navbar__icon-link" aria-label={`Wishlist (${wishlistCount})`}>
          <IconHeart size={18} className="navbar__icon-svg" />
          <span className="navbar__icon-label">Wishlist</span>
          {wishlistCount > 0 && (
            <span className="navbar__badge" aria-live="polite">{wishlistCount}</span>
          )}
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          className={`navbar__icon-link${bounce ? ' navbar__icon-link--bounce' : ''}`}
          aria-label={`Cart (${cartCount} items)`}
        >
          <IconCart size={18} className="navbar__icon-svg" />
          <span className="navbar__icon-label">Cart</span>
          {cartCount > 0 && (
            <span className="navbar__badge" aria-live="polite">{cartCount}</span>
          )}
        </Link>

        {/* Auth */}
        {isLoaded && (
          isSignedIn ? (
            <UserButton />
          ) : (
            <Link href="/sign-in" className="navbar__signin-btn">
              Sign In
            </Link>
          )
        )}
      </div>

      {/* ── Mobile Dropdown ── */}
      {menuOpen && (
        <div className="navbar__mobile-menu" role="navigation" aria-label="Mobile navigation">
          <Link href="/"               className="navbar__link" onClick={closeMenu}>Home</Link>
          <Link href="/products"       className="navbar__link" onClick={closeMenu}>Products</Link>
          <Link href="/my-orders"      className="navbar__link" onClick={closeMenu}>My Orders</Link>
          <Link href="/order-tracking" className="navbar__link navbar__link--track" onClick={closeMenu}>Track Order</Link>
          <Link href="/about"          className="navbar__link" onClick={closeMenu}>About</Link>
          <Link href="/contact"        className="navbar__link" onClick={closeMenu}>Contact</Link>

          <div className="navbar__mobile-menu-auth">
            {isLoaded && (
              isSignedIn ? (
                <UserButton />
              ) : (
                <Link href="/sign-in" className="navbar__signin-btn" style={{ width: '100%', textAlign: 'center', display: 'block' }} onClick={closeMenu}>
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
