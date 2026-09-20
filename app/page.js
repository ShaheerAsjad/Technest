import Link from 'next/link';
import Hero from '@/components/Hero';
import IntroLoader from '@/components/IntroLoader';
import Categories from '@/components/Categories';
import ProductCard from '@/components/ProductCard';
import TrustStrip from '@/components/TrustStrip';
import BrandStrip from '@/components/BrandStrip';
import { getHomeData } from '@/lib/catalog';
import { getStoreSettings } from '@/lib/settings';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'TechNest — Networking, CCTV & Tech Marketplace',
  description: 'Fiber, networking, CCTV and IT hardware from trusted brands, plus phones, laptops and gaming gear.',
};

function Section({ title, sub, href, hrefLabel = 'View all →', products }) {
  if (!products?.length) return null;
  return (
    <section className="featured">
      <div className="featured__header featured__header--row">
        <div>
          <h2 className="section-title">{title}</h2>
          {sub && <p className="featured__sub">{sub}</p>}
        </div>
        {href && <Link href={href} className="categories__see-all">{hrefLabel}</Link>}
      </div>
      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHomeData(), getStoreSettings()]);
  const sh = settings.shipping;
  const freeText = sh.enabled && sh.freeEnabled && sh.freeThreshold > 0 ? `Free shipping over ${formatPrice(sh.freeThreshold)}` : '';

  const nothing = !data.featured.length && !data.newNetworking.length && !data.newConsumer.length;

  return (
    <>
      <IntroLoader />
      <Hero freeShippingText={freeText} />
      <TrustStrip eta={sh.etaText} freeText={freeText} />
      <BrandStrip brands={data.brands} />
      <Categories tree={data.tree} />

      {nothing ? (
        <section className="featured">
          <div className="featured__empty"><p>Our catalogue is being updated. Please check back soon.</p></div>
        </section>
      ) : (
        <>
          <Section title="Featured Products" sub="Hand-picked from our latest inventory" href="/products?sort=featured" products={data.featured} />
          <Section title="New in Networking & IT" sub="Fiber, CCTV, switches and accessories" href="/products?dept=networking" products={data.newNetworking} />
          <Section title="New in Consumer Tech" sub="Phones, laptops, gaming and more" href="/products?dept=consumer" products={data.newConsumer} />
        </>
      )}

      <section className="home-cta">
        <div className="home-cta__inner">
          <div className="home-cta__glow" aria-hidden="true" />
          <p className="home-cta__label">Buying in bulk?</p>
          <h2 className="home-cta__title">Special pricing for businesses &amp; installers.</h2>
          <p className="home-cta__sub">Tell us what you need and we will reply with the best quote.</p>
          <Link href="/b2b" className="btn btn--primary home-cta__btn">Request a B2B Quote</Link>
        </div>
      </section>
    </>
  );
}
