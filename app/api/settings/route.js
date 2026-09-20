import { json } from '@/lib/api';
import { getStoreSettings, publicSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Public, non-sensitive subset of the store settings (shipping, tax, contact info).
export async function GET() {
  const s = await getStoreSettings();
  return json(publicSettings(s), 200, { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' });
}
