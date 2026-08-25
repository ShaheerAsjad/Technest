export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-skeleton" aria-hidden="true">
          <div className="product-skeleton__image shimmer" />
          <div className="product-skeleton__line shimmer" style={{ width: '40%' }} />
          <div className="product-skeleton__line shimmer" style={{ width: '80%' }} />
          <div className="product-skeleton__line shimmer" style={{ width: '50%' }} />
          <div className="product-skeleton__btn shimmer" />
        </div>
      ))}
    </div>
  );
}
