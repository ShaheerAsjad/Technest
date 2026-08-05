import Hero from '@/components/Hero';
import Categories from '@/components/Categories';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS } from '@/data/products';

export default function HomePage() {
  const featured = [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 8);

  return (
    <>
      <Hero />
      <Categories />
      <section className="featured">
        <h2 className="section-title">Featured Products</h2>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
