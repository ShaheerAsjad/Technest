'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer({ tree, store = {} }) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Do not render Footer on /admin routes
  if (pathname?.startsWith('/admin')) return null;

  const name = store.name || 'TechNest';
  const networking = (tree?.departments?.networking || []).slice(0, 6);
  const hasConsumer = (tree?.departments?.consumer || []).length > 0;
  const tel = store.phone ? store.phone.replace(/[^0-9+]/g, '') : '';

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* ── Brand column ── */}
        <div className="footer__brand">
          <div className="footer__brand-name">
            {name === 'TechNest' ? <>Tech<span>Nest</span></> : name}
          </div>
          <p className="footer__tagline">
            Networking, CCTV and IT hardware from trusted brands, alongside the latest consumer tech.
          </p>

          <ul className="footer__contact">
            {store.address && <li><span aria-hidden="true">📍</span>{store.address}</li>}
            {store.phone && <li><span aria-hidden="true">📞</span><a href={`tel:${tel}`}>{store.phone}</a></li>}
            {store.email && <li><span aria-hidden="true">✉</span><a href={`mailto:${store.email}`}>{store.email}</a></li>}
            {store.hours && <li><span aria-hidden="true">🕘</span>{store.hours}</li>}
          </ul>

          {(store.facebook || store.instagram) && (
            <div className="footer__social">
              {store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">f</a>}
              {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">IG</a>}
            </div>
          )}
        </div>

        {/* ── Shop column ── */}
        <div>
          <p className="footer__col-title">Shop</p>
          <div className="footer__links">
            <Link href="/products">All Products</Link>
            {networking.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>
            ))}
            {hasConsumer && <Link href="/products?dept=consumer">Consumer Tech</Link>}
          </div>
        </div>

        {/* ── Account column ── */}
        <div>
          <p className="footer__col-title">Account</p>
          <div className="footer__links">
            <Link href="/cart">Cart</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/my-orders">My Orders</Link>
            <Link href="/order-tracking">Track Order</Link>
            <Link href="/sign-in">Sign In</Link>
          </div>
        </div>

        {/* ── Information column ── */}
        <div>
          <p className="footer__col-title">Information</p>
          <div className="footer__links">
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/b2b">B2B / Bulk Orders</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/return-policy">Return Policy</Link>
            <Link href="/shipping-policy">Shipping Policy</Link>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer__bottom">
        <p className="footer__copy">© {year} {name}. All rights reserved.</p>
        <div className="footer__bottom-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
