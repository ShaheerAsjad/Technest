'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const { cartCount, wishlistCount, theme, toggleTheme } = useApp();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <Link href="/" className="navbar__logo">
        TechNest
      </Link>
      <div className="navbar__links">
        <Link href="/" className="navbar__link">Home</Link>
        <Link href="/products" className="navbar__link">Products</Link>
        <Link href="/about" className="navbar__link">About</Link>
        <Link href="/contact" className="navbar__link">Contact</Link>
      </div>
      <div className="navbar__actions">
        <button className="navbar__theme-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <Link href="/wishlist" className="navbar__icon-link">
          Wishlist ({wishlistCount})
        </Link>
        <Link href="/cart" className="navbar__icon-link">
          Cart ({cartCount})
        </Link>
      </div>
    </nav>
  );
}
