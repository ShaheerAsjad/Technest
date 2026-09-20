import { redirect } from 'next/navigation';
import CatalogView, { buildCategoryGroups } from '@/components/CatalogView';
import { listProducts, getFacets, getCategoryTree, findCategory } from '@/lib/catalog';
import { parseFilters, toQueryString } from '@/lib/catalog-params';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const f = parseFilters(sp);
  const t = f.q ? `Search: ${f.q}` : f.department === 'networking' ? 'Networking & IT Products' : f.department === 'consumer' ? 'Consumer Tech' : 'All Products';
  return { title: `${t} — TechNest`, description: 'Browse our catalogue: networking, CCTV, fiber and consumer tech.' };
}

export default async function ProductsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const filters = parseFilters(sp);
  const tree = await getCategoryTree();

  // Old-style links (?category=Phones or ?category=slug) -> canonical /category/<slug>
  if (filters.category) {
    const cat = findCategory(tree, filters.category);
    if (cat) redirect(`/category/${cat.slug}${toQueryString({ ...filters, category: '' })}`);
  }

  let result = { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 };
  let facets = null;
  let error = false;
  try {
    [result, facets] = await Promise.all([
      listProducts({ ...filters, pageSize: 24 }),
      getFacets({ q: filters.q, department: filters.department, onSale: filters.onSale }),
    ]);
  } catch (err) {
    console.error('[products page]', err?.message);
    error = true;
  }

  const title = filters.q
    ? `Results for “${filters.q}”`
    : filters.department === 'networking' ? 'Networking & IT'
    : filters.department === 'consumer' ? 'Consumer Tech'
    : 'All Products';

  return (
    <CatalogView
      title={title}
      subtitle={filters.q ? 'Products matching your search' : 'Discover our full catalogue'}
      breadcrumbs={[{ label: title }]}
      result={result}
      facets={facets}
      filters={filters}
      basePath="/products"
      categoryGroups={buildCategoryGroups({ tree, current: null, filters })}
      error={error}
    />
  );
}
