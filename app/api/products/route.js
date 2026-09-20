import { json, serverError } from '@/lib/api';
import { listProducts, getCategoryTree, findCategory, descendantIds } from '@/lib/catalog';
import { parseFilters, searchParamsToObject } from '@/lib/catalog-params';
import { clampInt } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/products?category=slug&brand=A,B&min=&max=&rating=&stock=in&q=&sort=&page=&pageSize=
export async function GET(request) {
  try {
    const sp = new URL(request.url).searchParams;
    const f = parseFilters(searchParamsToObject(sp));
    const filters = { ...f, pageSize: clampInt(sp.get('pageSize'), 1, 60, 24) };

    if (f.category) {
      const tree = await getCategoryTree();
      const cat = findCategory(tree, f.category);
      if (!cat) return json({ items: [], total: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 });
      filters.categoryIds = descendantIds(tree, cat.id);
    }
    const result = await listProducts(filters);
    return json(result, 200, { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' });
  } catch (err) {
    return serverError('api/products', err, 'Could not load products right now.');
  }
}
