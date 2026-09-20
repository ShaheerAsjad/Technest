import { notFound } from 'next/navigation';
import CatalogView, { buildCategoryGroups } from '@/components/CatalogView';
import { listProducts, getFacets, getCategoryTree, findCategory, descendantIds, breadcrumbFor } from '@/lib/catalog';
import { parseFilters } from '@/lib/catalog-params';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tree = await getCategoryTree();
  const cat = findCategory(tree, slug);
  if (!cat) return { title: 'Category not found — TechNest' };
  return { title: `${cat.name} — TechNest`, description: `Shop ${cat.name} (${cat.count} products) at TechNest.` };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const filters = parseFilters(sp);
  const tree = await getCategoryTree();
  const cat = findCategory(tree, slug);
  if (!cat) notFound();

  const categoryIds = descendantIds(tree, cat.id);
  let result = { items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 };
  let facets = null;
  let error = false;
  try {
    [result, facets] = await Promise.all([
      listProducts({ ...filters, categoryIds, pageSize: 24 }),
      getFacets({ categoryIds, q: filters.q, onSale: filters.onSale }),
    ]);
  } catch (err) {
    console.error('[category page]', err?.message);
    error = true;
  }

  const trail = breadcrumbFor(tree, cat.id);
  const crumbs = [
    { label: 'Products', href: '/products' },
    ...trail.map((t, i) => (i === trail.length - 1 ? { label: t.name } : { label: t.name, href: `/category/${t.slug}` })),
  ];

  return (
    <CatalogView
      title={cat.name}
      subtitle={`${cat.count} product${cat.count === 1 ? '' : 's'}`}
      breadcrumbs={crumbs}
      result={result}
      facets={facets}
      filters={filters}
      basePath={`/category/${cat.slug}`}
      categoryGroups={buildCategoryGroups({ tree, current: cat, filters })}
      error={error}
    />
  );
}
