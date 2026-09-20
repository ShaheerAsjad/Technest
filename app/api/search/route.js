import { json, serverError } from '@/lib/api';
import { searchSuggest } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

// GET /api/search?q=dahua  -> { products[], brands[], categories[], total }
export async function GET(request) {
  try {
    const q = new URL(request.url).searchParams.get('q') || '';
    const data = await searchSuggest(q, 8);
    return json(data, 200, { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' });
  } catch (err) {
    return serverError('api/search', err, 'Search is unavailable right now.');
  }
}
