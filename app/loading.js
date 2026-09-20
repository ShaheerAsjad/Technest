// Shown by Next.js while a route segment is loading (skeleton, instant feedback).
export default function Loading() {
  return (
    <div className="container py-8" aria-busy="true" aria-live="polite">
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card__img" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}
