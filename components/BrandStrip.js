import Link from 'next/link';

/** "Trusted brands" strip on the home page (from the brands table). */
export default function BrandStrip({ brands = [] }) {
  const list = brands.filter((b) => b.count > 0);
  if (!list.length) return null;
  const featured = list.filter((b) => b.featured);
  const shown = (featured.length >= 4 ? featured : list).slice(0, 12);

  return (
    <section className="brandstrip" aria-label="Brands">
      <p className="brandstrip__title">Trusted brands we stock</p>
      <div className="brandstrip__row">
        {shown.map((b) => (
          <Link key={b.slug} href={`/products?brand=${encodeURIComponent(b.name)}`} className="brandstrip__item" title={`${b.name} (${b.count})`}>
            {b.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={b.logo} alt={b.name} loading="lazy" />
              : <span>{b.name}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
