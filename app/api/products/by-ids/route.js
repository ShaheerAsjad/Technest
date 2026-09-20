import { json, serverError } from '@/lib/api';
import { getProductsByIds } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

// GET /api/products/by-ids?ids=1,2,3   (max 60) - used by cart, wishlist, recently viewed
export async function GET(request) {
  try {
    const ids = (new URL(request.url).searchParams.get('ids') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60);
    const items = await getProductsByIds(ids);
    return json({ items }, 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    return serverError('api/products/by-ids', err, 'Could not load products.');
  }
}
