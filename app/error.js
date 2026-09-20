'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Route-level error boundary: a crash in one page never shows a blank screen.
export default function Error({ error, reset }) {
  useEffect(() => { console.error('[page error]', error); }, [error]);
  const message = String(error?.message || '').slice(0, 300);
  return (
    <div className="container py-8 text-center" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 className="page-title mb-4">Something went wrong</h1>
      <p className="mb-6" style={{ color: 'var(--text-muted)', maxWidth: 460 }}>
        We hit an unexpected problem loading this page. You can try again, or head back to the store.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn--primary" onClick={() => reset()}>Try again</button>
        <Link href="/" className="btn btn--ghost">Go to home</Link>
      </div>
      <details style={{ marginTop: 28, maxWidth: 560, color: 'var(--text-muted)', fontSize: 13, textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer' }}>Technical details (send this to the developer)</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8 }}>
          {message || 'No message (server-side error - see Vercel > Logs).'}
          {error?.digest ? `\nDigest: ${error.digest}` : ''}
        </pre>
      </details>
    </div>
  );
}
