import Link from 'next/link';

const HERO_IMAGE =
  'https://images.pexels.com/photos/986774/pexels-photo-986774.jpeg?auto=compress&cs=tinysrgb&w=1600';

export default function Hero() {
  return (
    <section className="hero" style={{ backgroundImage: `url('${HERO_IMAGE}')` }}>
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1 className="hero__title">Tech that moves you forward</h1>
        <p className="hero__subtitle">
          Phones, laptops, gaming gear, and accessories — all in one place.
        </p>
        <Link href="/products" className="btn btn--primary hero__cta">
          Shop Now
        </Link>
      </div>
    </section>
  );
}
