import Link from 'next/link';
import { Fragment } from 'react';
import ProductCard from './ProductCard';
import FilterSidebar from './FilterSidebar';
import SortSelect from './SortSelect';
import Pagination from './Pagination';
import { SORT_OPTIONS } from '@/lib/catalog';
import { toQueryString } from '@/lib/catalog-params';
import { formatPrice } from '@/lib/format';

const DEPT_TITLES = { networking: 'Networking & IT', consumer: 'Consumer Tech' };

/** Builds the "Categories" groups for the sidebar. */
export function buildCategoryGroups({ tree, current, filters, basePathAll = '/products' }) {
  const keep = { q: filters.q, sort: filters.sort };
  const qs = toQueryString(keep);
  const link = (c) => ({ name: c.name, slug: c.slug, count: c.count, href: `/category/${c.slug}${qs}` });

  if (current) {
    const parent = current.parentId ? tree.flat.find((c) => c.id === current.parentId) : null;
    const node = (function find(list) {
      for (const n of list) { if (n.id === current.id) return n; const f = find(n.children || []); if (f) return f; }
      return null;
    })(tree.roots);
    const children = node?.children || [];
    const items = [];
    items.push({ name: 'All Products', slug: '__all', href: `${basePathAll}${qs}` });
    if (parent) items.push({ ...link(parent), isParent: true });
    items.push({ ...link(current), active: true });
    const sub = children.length ? children : (parent ? (tree.flat.filter((c) => c.parentId === parent.id && c.id !== current.id)) : []);
    sub.forEach((c) => items.push(link(c)));
    return [{ title: '', items }];
  }

  const depts = filters.department ? [filters.department] : ['networking', 'consumer'];
  const groups = [];
  for (const d of depts) {
    const roots = tree.departments?.[d] || [];
    if (!roots.length) continue;
    groups.push({ title: depts.length > 1 ? DEPT_TITLES[d] : '', items: roots.map(link) });
  }
  return groups;
}

function activeFilterChips({ filters, basePath }) {
  const chips = [];
  const remove = (over) => `${basePath}${toQueryString({ ...filters, ...over, page: 1 })}`;
  filters.brands.forEach((b) =>
    chips.push({ key: `b-${b}`, label: b, href: remove({ brands: filters.brands.filter((x) => x !== b) }) }));
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const lo = filters.minPrice !== undefined ? formatPrice(filters.minPrice) : 'Any';
    const hi = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : 'Any';
    chips.push({ key: 'price', label: `${lo} – ${hi}`, href: remove({ minPrice: undefined, maxPrice: undefined }) });
  }
  if (filters.minRating) chips.push({ key: 'rating', label: `${filters.minRating}★ & up`, href: remove({ minRating: undefined }) });
  if (filters.stock) chips.push({ key: 'stock', label: filters.stock === 'in' ? 'In stock' : 'Out of stock', href: remove({ stock: undefined }) });
  if (filters.onSale) chips.push({ key: 'sale', label: 'On sale', href: remove({ onSale: false }) });
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, href: remove({ q: '' }) });
  return chips;
}

/**
 * Shared catalogue layout used by /products and /category/[slug].
 * Server component: the product grid + pagination are plain HTML; only the sidebar/sort are client components.
 */
export default function CatalogView({ title, subtitle, breadcrumbs = [], result, facets, filters, basePath, categoryGroups, error = false }) {
  const chips = activeFilterChips({ filters, basePath });
  const clearHref = `${basePath}${toQueryString({ q: filters.q, sort: filters.sort, department: filters.department })}`;

  return (
    <div className="catalog-page">
      <div className="catalog-page__header">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumbs__list">
              <li className="breadcrumbs__item"><Link href="/">Home</Link></li>
              {breadcrumbs.map((b, i) => (
                <Fragment key={i}>
                  <li className="breadcrumbs__separator" aria-hidden="true">/</li>
                  <li className={`breadcrumbs__item${b.href ? '' : ' breadcrumbs__item--current'}`} aria-current={b.href ? undefined : 'page'}>
                    {b.href ? <Link href={b.href}>{b.label}</Link> : b.label}
                  </li>
                </Fragment>
              ))}
            </ol>
          </nav>
          <h1 className="page-title catalog-page__title">{title}</h1>
          {subtitle && <p className="catalog-page__sub">{subtitle}</p>}
        </div>
      </div>

      <div className="container py-4">
        <div className="catalog-layout">
          <FilterSidebar basePath={basePath} filters={filters} facets={facets} categoryGroups={categoryGroups} activeCount={chips.length} />

          <div className="catalog-main">
            <div className="catalog-toolbar">
              <p className="catalog-count">
                {error ? 'Products unavailable' : <><strong>{result.total}</strong> product{result.total === 1 ? '' : 's'}</>}
              </p>
              <SortSelect basePath={basePath} filters={filters} options={SORT_OPTIONS} />
            </div>

            {chips.length > 0 && (
              <div className="active-filters">
                {chips.map((c) => (
                  <Link key={c.key} href={c.href} className="active-chip" aria-label={`Remove filter ${c.label}`}>{c.label} <span aria-hidden="true">×</span></Link>
                ))}
                <Link href={clearHref} className="active-filters__clear">Clear all</Link>
              </div>
            )}

            {error ? (
              <div className="catalog-empty">
                <p className="catalog-empty__text">We could not load products right now.</p>
                <p className="catalog-empty__hint">Please refresh the page in a moment.</p>
                <Link href={basePath} className="btn btn--primary mt-4">Try again</Link>
              </div>
            ) : result.items.length === 0 ? (
              <div className="catalog-empty">
                <p className="catalog-empty__text">No products match your filters.</p>
                <p className="catalog-empty__hint">Try removing a filter or searching for something else.</p>
                <Link href={clearHref} className="btn btn--ghost mt-4">Clear filters</Link>
              </div>
            ) : (
              <div className="product-grid catalog-grid">
                {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {!error && <Pagination basePath={basePath} filters={filters} page={result.page} totalPages={result.totalPages} />}
          </div>
        </div>
      </div>
    </div>
  );
}
