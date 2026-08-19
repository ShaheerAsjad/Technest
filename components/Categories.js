import Link from 'next/link';
import { CATEGORIES } from '@/data/products';

/* Category icon map — purely presentational */
const CATEGORY_META = {
  'Phones':       { icon: '📱', desc: 'Flagship & mid-range' },
  'Laptops':      { icon: '💻', desc: 'Work & creative' },
  'Headphones':   { icon: '🎧', desc: 'Studio & wireless' },
  'Gaming':       { icon: '🎮', desc: 'Consoles & gear' },
  'Smart Watches':{ icon: '⌚', desc: 'Fitness & style' },
  'Accessories':  { icon: '🔌', desc: 'Cables & more' },
};

export default function Categories() {
  return (
    <section className="categories">
      <div className="categories__header">
        <h2 className="section-title">Shop by Category</h2>
        <Link href="/products" className="categories__see-all">
          View All →
        </Link>
      </div>

      <div className="categories__grid">
        {CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category] || { icon: '⚡', desc: 'Explore' };
          return (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="category-card reveal reveal--visible"
            >
              <span className="category-card__icon" aria-hidden="true">
                {meta.icon}
              </span>
              <span className="category-card__name">{category}</span>
              <span className="category-card__desc">{meta.desc}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
