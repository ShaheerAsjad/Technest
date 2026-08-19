import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="not-found">
      {/* Glowing 404 code */}
      <div className="not-found__glow" aria-hidden="true" />
      <h1 className="not-found__code" aria-label="404 — Page not found">404</h1>

      {/* Cyan divider line */}
      <span className="not-found__line" aria-hidden="true" />

      <p className="not-found__text">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="not-found__actions">
        <Link href="/" className="btn btn--primary">
          Back to Home
        </Link>
        <Link href="/products" className="btn btn--ghost">
          Browse Products
        </Link>
      </div>
    </section>
  );
}
