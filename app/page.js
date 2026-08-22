import Hero from '@/components/Hero';
import IntroLoader from '@/components/IntroLoader';
import Categories from '@/components/Categories';
import ProductCard from '@/components/ProductCard';
import sql from '@/lib/db';

export const metadata = {
  title: 'TechNest — Premium Tech Marketplace',
  description: 'Phones, laptops, gaming gear, and accessories — curated for the next generation.',
};

export default async function HomePage() {
  // ── Neon PostgreSQL fetch — DO NOT MODIFY ──────────────────────
  let products = [];
  try {
    products = await sql`
      SELECT 
        products.id, 
        products.title, 
        products.description, 
        products.price, 
        products.stock, 
        products.image, 
        categories.name AS category 
      FROM products 
      LEFT JOIN categories ON products.category_id = categories.id
    `;
  } catch (error) {
    console.error("Database Fetch Error:", error);
  }

  // DB products ko ProductCard ke format mein convert karo
  const featured = products.map((p) => ({
    id:          p.id,
    name:        p.title,
    description: p.description,
    price:       parseFloat(p.price),
    stock:       p.stock,
    category:    p.category || 'General',
    rating:      4,                            // Default rating
    image:       p.image || '/placeholder.png', // DB se image dynamic le raha hai
  }));
  // ───────────────────────────────────────────────────────────────

  return (
    <>
      <IntroLoader />
      {/* ── Cinematic Hero ── */}
      <Hero />


      {/* ── Shop by Category ── */}
      <Categories />

      {/* ── Featured Products ── */}
      <section className="featured">
        <div className="featured__header">
          <h2 className="section-title">Featured Products</h2>
          <p className="featured__sub">
            Hand-picked from our latest inventory
          </p>
        </div>

        {featured.length === 0 ? (
          <div className="featured__empty">
            <p>No products found. Check back soon.</p>
          </div>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="home-cta">
        <div className="home-cta__inner">
          <div className="home-cta__glow" aria-hidden="true" />
          <p className="home-cta__label">Ready to upgrade?</p>
          <h2 className="home-cta__title">The future of tech is here.</h2>
          <p className="home-cta__sub">
            Browse our full catalog of phones, laptops, gaming gear and more.
          </p>
          <Link href="/products" className="btn btn--primary home-cta__btn">
            Explore All Products
          </Link>
        </div>
      </section>
    </>
  );
}