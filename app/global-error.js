'use client';

// Last-resort boundary (errors inside the root layout itself). Must render its own <html>.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#070708', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>We&apos;ll be right back</h1>
          <p style={{ color: '#a3a3a3', maxWidth: 420, marginBottom: 24 }}>Something went wrong on our side. Please try again in a moment.</p>
          <button onClick={() => reset()} style={{ background: '#FF6600', color: '#000', border: 0, borderRadius: 10, padding: '12px 22px', fontWeight: 700, cursor: 'pointer' }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
