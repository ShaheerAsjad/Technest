'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const { cartCount, wishlistCount, theme, toggleTheme } = useApp();
  const { isSignedIn, isLoaded } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Trigger a brief bounce animation on the cart link whenever the count goes up.
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 400);
      prevCount.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  // Close the mobile menu automatically if the viewport grows past mobile width.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 767) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <Link href="/" className="navbar__logo">
        TechNest
      </Link>

      <div className="navbar__links">
        <Link href="/" className="navbar__link">Home</Link>
        <Link href="/products" className="navbar__link">Products</Link>
        <Link href="/my-orders" className="navbar__link">My Orders</Link>
        <Link href="/order-tracking" className="navbar__link" style={{ color: '#0070f3', fontWeight: '600' }}>Track Order</Link>
        <Link href="/about" className="navbar__link">About</Link>
        <Link href="/contact" className="navbar__link">Contact</Link>
      </div>

      <div className="navbar__actions">
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <button className="navbar__theme-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <Link href="/wishlist" className="navbar__icon-link">
          <span className="navbar__icon-emoji" aria-hidden="true">🤍</span>
          <span className="navbar__icon-label">Wishlist</span> ({wishlistCount})
        </Link>
        <Link
          href="/cart"
          className={`navbar__icon-link${bounce ? ' navbar__icon-link--bounce' : ''}`}
        >
          <span className="navbar__icon-emoji" aria-hidden="true">🛒</span>
          <span className="navbar__icon-label">Cart</span> ({cartCount})
        </Link>

        {isLoaded && (
          isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button 
                type="button"
                style={{ 
                  padding: '8px 16px', 
                  background: '#0070f3', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Sign In
              </button>
            </SignInButton>
          )
        )}
      </div>

      {menuOpen && (
        <div className="navbar__mobile-menu">
          <Link href="/" className="navbar__link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/products" className="navbar__link" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/my-orders" className="navbar__link" onClick={() => setMenuOpen(false)}>My Orders</Link>
          <Link href="/order-tracking" className="navbar__link" style={{ color: '#0070f3', fontWeight: '600' }} onClick={() => setMenuOpen(false)}>Track Order</Link>
          <Link href="/about" className="navbar__link" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/contact" className="navbar__link" onClick={() => setMenuOpen(false)}>Contact</Link>
          
          <div style={{ marginTop: '10px' }}>
            {isLoaded && (
              isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <button 
                    type="button"
                    style={{ 
                      width: '100%',
                      padding: '8px 16px', 
                      background: '#0070f3', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Sign In
                  </button>
                </SignInButton>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
