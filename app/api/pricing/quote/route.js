import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { getStoreSettings, publicSettings } from '@/lib/settings';
import { computePricing } from '@/lib/pricing';
import { loadCartLines, findCouponByCode } from '@/lib/checkout';
import { cleanText } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// POST { items:[{id,quantity}], city, coupon, paymentMethod } -> full server-side price breakdown
export async function POST(request) {
  try {
    const body = await readJson(request);
    if (!body) return json({ error: 'Invalid request.' }, 400, NO_STORE);

    const settings = await getStoreSettings();
    const { lines, problems, warnings } = await loadCartLines(body.items, { clip: true });
    const paymentMethod = body.paymentMethod === 'bank' ? 'bank' : 'cod';
    const city = cleanText(body.city, 60);

    const { coupon, error: couponLookupError } = await findCouponByCode(body.coupon);
    const pricing = computePricing({ items: lines, settings, city, coupon, paymentMethod });

    return json(
      {
        lines,
        problems,
        warnings,
        pricing: {
          ...pricing,
          items: undefined,
          couponError: couponLookupError || pricing.couponError,
        },
        settings: publicSettings(settings),
      },
      200,
      NO_STORE
    );
  } catch (err) {
    return serverError('api/pricing/quote', err, 'Could not calculate your total. Please refresh and try again.');
  }
}
