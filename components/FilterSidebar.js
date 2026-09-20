'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toQueryString } from '@/lib/catalog-params';
import { formatPrice } from '@/lib/format';

function Section({ id, title, collapsed, onToggle, children }) {
  return (
    <div className="filter-section">
      <button type="button" className="filter-section__head" onClick={() => onToggle(id)} aria-expanded={!collapsed[id]}>
        <span>{title}</span>
        <span className={`filter-section__chev${collapsed[id] ? '' : ' is-open'}`} aria-hidden="true">⌃</span>
      </button>
      {!collapsed[id] && <div className="filter-section__body">{children}</div>}
    </div>
  );
}

/**
 * Atlantic-style filter sidebar: Categories (with counts), Price, Brand, Rating, Availability.
 * All state lives in the URL (shareable, back-button friendly); the server re-renders the list.
 * On phones it becomes a slide-up sheet opened by the "Filters" button.
 */
export default function FilterSidebar({ basePath, filters, facets, categoryGroups = [], activeCount = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    setMinPrice(filters.minPrice ?? '');
    setMaxPrice(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const go = (next) => {
    const merged = { ...filters, ...next, page: 1 };
    router.push(`${basePath}${toQueryString(merged)}`, { scroll: false });
  };
  const toggle = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const toggleBrand = (name) => {
    const has = filters.brands.some((b) => b.toLowerCase() === name.toLowerCase());
    const brands = has ? filters.brands.filter((b) => b.toLowerCase() !== name.toLowerCase()) : [...filters.brands, name];
    go({ brands });
  };

  const applyPrice = (e) => {
    e?.preventDefault();
    const min = minPrice === '' ? undefined : Math.max(0, Number(minPrice));
    const max = maxPrice === '' ? undefined : Math.max(0, Number(maxPrice));
    if (min !== undefined && max !== undefined && min > max) { go({ minPrice: max, maxPrice: min }); return; }
    go({ minPrice: Number.isFinite(min) ? min : undefined, maxPrice: Number.isFinite(max) ? max : undefined });
  };

  return (
    <>
      <button type="button" className="catalog-filter-toggle" onClick={() => setOpen(true)}>
        <span aria-hidden="true">☰</span> Filters{activeCount > 0 && <b>{activeCount}</b>}
      </button>

      {open && <div className="catalog-sidebar__backdrop" onClick={() => setOpen(false)} />}

      <aside className={`catalog-sidebar${open ? ' is-open' : ''}`} aria-label="Filters">
        <div className="catalog-sidebar__top">
          <strong>Filters</strong>
          {activeCount > 0 && <Link href={`${basePath}${toQueryString({ q: filters.q, sort: filters.sort, department: filters.department })}`} className="catalog-sidebar__clear">Clear all</Link>}
          <button type="button" className="catalog-sidebar__close" onClick={() => setOpen(false)} aria-label="Close filters">&times;</button>
        </div>

        {categoryGroups.length > 0 && (
          <Section id="cat" title="Categories" collapsed={collapsed} onToggle={toggle}>
            {categoryGroups.map((g, gi) => (
              <div key={gi} className="filter-group">
                {g.title && <p className="filter-group__title">{g.title}</p>}
                <ul className="filter-list">
                  {g.items.map((c) => (
                    <li key={c.slug}>
                      <Link href={c.href} className={`filter-link${c.active ? ' is-active' : ''}${c.isParent ? ' is-parent' : ''}`}>
                        <span>{c.name}</span>
                        {c.count !== undefined && <span className="filter-count">{c.count}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        <Section id="price" title="Price (Rs.)" collapsed={collapsed} onToggle={toggle}>
          <form className="filter-price" onSubmit={applyPrice}>
            <input type="number" inputMode="numeric" min="0" placeholder={facets?.minPrice ? `Min ${Math.floor(facets.minPrice)}` : 'Min'} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="Minimum price" />
            <span>–</span>
            <input type="number" inputMode="numeric" min="0" placeholder={facets?.maxPrice ? `Max ${Math.ceil(facets.maxPrice)}` : 'Max'} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price" />
            <button type="submit" className="btn btn--primary filter-price__apply">Apply</button>
          </form>
          {facets && facets.maxPrice > 0 && <p className="filter-hint">Range: {formatPrice(facets.minPrice)} – {formatPrice(facets.maxPrice)}</p>}
        </Section>

        {facets?.brands?.length > 0 && (
          <Section id="brand" title="Brand" collapsed={collapsed} onToggle={toggle}>
            <ul className="filter-list">
              {facets.brands.filter((b) => b && b.name).map((b) => {
                const checked = filters.brands.some((x) => x.toLowerCase() === String(b.name).toLowerCase());
                return (
                  <li key={b.name}>
                    <label className="filter-check">
                      <input type="checkbox" checked={checked} onChange={() => toggleBrand(b.name)} />
                      <span>{b.name}</span>
                      <span className="filter-count">{b.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <Section id="rating" title="Rating" collapsed={collapsed} onToggle={toggle}>
          <ul className="filter-list">
            {[4, 3, 2].map((r) => (
              <li key={r}>
                <label className="filter-check">
                  <input type="radio" name="rating" checked={filters.minRating === r} onChange={() => go({ minRating: r })} />
                  <span className="filter-stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                  <span className="filter-hint">&amp; up</span>
                </label>
              </li>
            ))}
            {filters.minRating ? (
              <li><button type="button" className="filter-reset" onClick={() => go({ minRating: undefined })}>Any rating</button></li>
            ) : null}
          </ul>
        </Section>

        <Section id="stock" title="Availability" collapsed={collapsed} onToggle={toggle}>
          <ul className="filter-list">
            <li>
              <label className="filter-check">
                <input type="checkbox" checked={filters.stock === 'in'} onChange={() => go({ stock: filters.stock === 'in' ? undefined : 'in' })} />
                <span>In stock</span>
                {facets && <span className="filter-count">{facets.inStock}</span>}
              </label>
            </li>
            <li>
              <label className="filter-check">
                <input type="checkbox" checked={filters.stock === 'out'} onChange={() => go({ stock: filters.stock === 'out' ? undefined : 'out' })} />
                <span>Out of stock</span>
                {facets && <span className="filter-count">{facets.outStock}</span>}
              </label>
            </li>
          </ul>
        </Section>

        <div className="catalog-sidebar__apply">
          <button type="button" className="btn btn--primary" onClick={() => setOpen(false)}>Show results</button>
        </div>
      </aside>
    </>
  );
}
