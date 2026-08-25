import Link from 'next/link';
import { CATEGORIES } from '@/data/products';

/* ─── Custom line-icons (stroke-based, matches the cyan/amber theme) ─── */
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

function IconLaptop() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4.5" width="16" height="10.5" rx="1.3" />
      <path d="M2 19.5h20l-1.6-3H3.6z" />
    </svg>
  );
}

function IconHeadphones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13.5v-2a9 9 0 0 1 18 0v2" />
      <rect x="2.3" y="13" width="4.4" height="7" rx="1.4" />
      <rect x="17.3" y="13" width="4.4" height="7" rx="1.4" />
    </svg>
  );
}

function IconGaming() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8.5h2.6M8.3 7.2v2.6" />
      <circle cx="16" cy="8.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="10.3" r="0.9" fill="currentColor" stroke="none" />
      <path d="M6.5 7h11a4 4 0 0 1 3.9 4.9l-1 4.3a2.6 2.6 0 0 1-4.7 1L14 15.5a2.8 2.8 0 0 0-2-.9 2.8 2.8 0 0 0-2 .9l-1.7 1.7a2.6 2.6 0 0 1-4.7-1l-1-4.3A4 4 0 0 1 6.5 7z" />
    </svg>
  );
}

function IconWatch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="2.4" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M9 17v2.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V17" />
      <path d="M12 10v2l1.4 1.4" />
    </svg>
  );
}

function IconAccessory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

const CATEGORY_META = {
  'Phones':        { Icon: IconPhone,       desc: 'Flagship & mid-range' },
  'Laptops':       { Icon: IconLaptop,      desc: 'Work & creative' },
  'Headphones':    { Icon: IconHeadphones,  desc: 'Studio & wireless' },
  'Gaming':        { Icon: IconGaming,      desc: 'Consoles & gear' },
  'Smart Watches': { Icon: IconWatch,       desc: 'Fitness & style' },
  'Accessories':   { Icon: IconAccessory,   desc: 'Cables & more' },
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
          const meta = CATEGORY_META[category] || { Icon: IconAccessory, desc: 'Explore' };
          const { Icon } = meta;
          return (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="category-card reveal reveal--visible"
            >
              <span className="category-card__icon-ring" aria-hidden="true">
                <Icon />
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
