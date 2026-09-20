import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-8 text-center" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.12em' }}>404</p>
      <h1 className="page-title mb-4">Page not found</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)', maxWidth: 440 }}>
        The page you are looking for does not exist or has moved.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/products" className="btn btn--primary">Browse products</Link>
        <Link href="/" className="btn btn--ghost">Go to home</Link>
      </div>
    </div>
  );
}
