import Link from 'next/link';

const TEAM_IMAGE =
  'https://images.pexels.com/photos/29267512/pexels-photo-29267512.jpeg?auto=compress&cs=tinysrgb&w=1200';

const FEATURES = [
  {
    icon: '🚚',
    title: 'Fast, Free Shipping',
    text: 'Free delivery on every order over $100, with express options when you need it sooner.',
  },
  {
    icon: '🛡️',
    title: 'Trusted Brands Only',
    text: 'Every product is sourced from established manufacturers — no knockoffs, ever.',
  },
  {
    icon: '↩️',
    title: 'Easy Returns',
    text: "Not the right fit? Our support team makes returns and exchanges simple.",
  },
  {
    icon: '💬',
    title: 'Real Human Support',
    text: 'Questions before you buy? Reach out any time through our Contact page.',
  },
];

const STATS = [
  { value: '30+', label: 'Curated Products' },
  { value: '6',   label: 'Categories' },
  { value: '4.6★', label: 'Avg. Rating' },
];

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* ── Hero header ── */}
      <div className="about-page__hero">
        <div className="about-page__hero-glow" aria-hidden="true" />
        <div className="about-page__hero-inner">
          <span className="about-page__eyebrow">Our Story</span>
          <h1 className="page-title about-page__title">About TechNest</h1>
          <p className="about-page__sub">
            TechNest was built to make discovering great tech simple. We curate phones, laptops,
            gaming gear, smart watches, and accessories from trusted brands — all in one clean
            and fast shopping experience.
          </p>
        </div>
      </div>

      {/* ── Team image ── */}
      <div className="about-body">
        <div className="about-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TEAM_IMAGE} alt="TechNest team collaborating" />
        </div>

        {/* ── Stats ── */}
        <div className="about-stats">
          {STATS.map((stat) => (
            <div key={stat.label} className="about-stats__item">
              <span className="about-stats__value">{stat.value}</span>
              <span className="about-stats__label">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Why shop with us ── */}
        <h2 className="section-title">Why Shop With Us</h2>
        <div className="about-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="about-feature-card">
              <span className="about-feature-card__icon">{feature.icon}</span>
              <h3 className="about-feature-card__title">{feature.title}</h3>
              <p className="about-feature-card__text">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* ── Footer note + CTA ── */}
        <div className="about-footer-note">
          <p className="static-page__text">
            This platform is also a demonstration of a modern e-commerce front-end, built with
            Next.js 14, Clerk auth, and Neon PostgreSQL.
          </p>
          <Link href="/products" className="btn btn--primary">
            Explore Products →
          </Link>
        </div>
      </div>
    </div>
  );
}
