import Link from 'next/link';
import { CATEGORIES } from '@/data/products';

export default function Categories() {
  return (
    <section className="categories">
      <h2 className="section-title">Shop by Category</h2>
      <div className="categories__grid">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/products?category=${encodeURIComponent(category)}`}
            className="category-card reveal reveal--visible"
          >
            {category}
          </Link>
        ))}
      </div>
    </section>
  );
}
