import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__text">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn btn--primary">
        Back to Home
      </Link>
    </section>
  );
}
