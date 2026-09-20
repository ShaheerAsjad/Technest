import Link from 'next/link';

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


function IconFiber() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17c4 0 4-10 9-10s5 10 9 10" />
      <circle cx="3" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 15 5l1.4 4.6L4.4 13z" />
      <path d="M16 8l4.5-1.3" />
      <path d="M8 12.5v3.5m-3 0h8" />
    </svg>
  );
}

function IconRack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1.6" />
      <path d="M4 9h16M4 15h16M8 6h.01M8 12h.01M8 18h.01" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="2.5" y="16" width="6" height="5" rx="1" />
      <rect x="15.5" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M5.5 16v-4h13v4" />
    </svg>
  );
}

function IconAV() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="1.6" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const DEPT_LABELS = { networking: 'Networking, CCTV & IT', consumer: 'Consumer Tech' };

/** Pick an icon from the category name (works for any category an admin creates later). */
function iconFor(name = '') {
  const n = name.toLowerCase();
  if (/sfp|fiber|fibre|patch|odf|splitter|pigtail|ftth/.test(n)) return IconFiber;
  if (/cctv|camera|dvr|nvr|surveil|hikvision|dahua|tapo/.test(n)) return IconCamera;
  if (/rack|cabinet/.test(n)) return IconRack;
  if (/network|switch|router|wifi|wi-fi|access point|ruijie|tp-link|poe/.test(n)) return IconNetwork;
  if (/hdmi|av\b|display|projector/.test(n)) return IconAV;
  if (/phone|mobile/.test(n)) return IconPhone;
  if (/laptop|computer|pc/.test(n)) return IconLaptop;
  if (/headphone|audio|speaker|earbud/.test(n)) return IconHeadphones;
  if (/gam/.test(n)) return IconGaming;
  if (/watch/.test(n)) return IconWatch;
  return IconAccessory;
}

/** Home page "Shop by Category" - built from the live category tree, grouped by department. */
export default function Categories({ tree }) {
  const departments = ['networking', 'consumer'].filter((d) => tree?.departments?.[d]?.length);
  if (!departments.length) return null;

  return (
    <section className="categories">
      <div className="categories__header">
        <h2 className="section-title">Shop by Category</h2>
        <Link href="/products" className="categories__see-all">View All →</Link>
      </div>

      {departments.map((dept) => (
        <div key={dept} className="categories__dept">
          {departments.length > 1 && (
            <div className="categories__dept-head">
              <h3>{DEPT_LABELS[dept]}</h3>
              <Link href={`/products?dept=${dept}`}>Browse all →</Link>
            </div>
          )}
          <div className="categories__grid">
            {tree.departments[dept].slice(0, 12).map((cat) => {
              const Icon = iconFor(cat.name);
              return (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="category-card reveal reveal--visible">
                  <span className="category-card__icon-ring" aria-hidden="true"><Icon /></span>
                  <span className="category-card__name">{cat.name}</span>
                  <span className="category-card__desc">{cat.count} product{cat.count === 1 ? '' : 's'}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
