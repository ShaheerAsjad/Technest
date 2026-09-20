import { json } from '@/lib/api';
import { getCategoryTree } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tree = await getCategoryTree(); // never throws
  return json(tree, 200, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' });
}
