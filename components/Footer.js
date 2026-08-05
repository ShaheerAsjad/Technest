import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <p>© {year} TechNest. All rights reserved.</p>
      <div className="footer__links">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </footer>
  );
}
