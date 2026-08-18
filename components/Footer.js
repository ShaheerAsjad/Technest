import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* ── Brand column ── */}
        <div className="footer__brand">
          <div className="footer__brand-name">
            Tech<span>Nest</span>
          </div>
          <p className="footer__tagline">
            The future of tech shopping. Phones, laptops, gaming gear, and accessories
            — curated for the next generation.
          </p>
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="Twitter / X">
              𝕏
            </a>
            <a href="#" className="footer__social-link" aria-label="Instagram">
              IG
            </a>
            <a href="#" className="footer__social-link" aria-label="GitHub">
              GH
            </a>
          </div>
        </div>

        {/* ── Shop column ── */}
        <div>
          <p className="footer__col-title">Shop</p>
          <div className="footer__links">
            <Link href="/products">All Products</Link>
            <Link href="/products?category=Phones">Phones</Link>
            <Link href="/products?category=Laptops">Laptops</Link>
            <Link href="/products?category=Gaming">Gaming</Link>
            <Link href="/products?category=Accessories">Accessories</Link>
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
          </div>
        </div>

        {/* ── Company column ── */}
        <div>
          <p className="footer__col-title">Company</p>
          <div className="footer__links">
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer__bottom">
        <p className="footer__copy">
          © {year} TechNest. All rights reserved.
        </p>
        <div className="footer__bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
