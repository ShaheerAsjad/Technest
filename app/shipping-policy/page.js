import PolicyPage from '@/components/PolicyPage';
import { getStoreSettings } from '@/lib/settings';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shipping Policy — TechNest' };

export default async function ShippingPolicyPage() {
  const { shipping: sh, payment } = await getStoreSettings();
  const list = [];
  if (sh.enabled) {
    list.push(`Standard delivery charge: ${formatPrice(sh.defaultFee)}${sh.etaText ? ` (${sh.etaText})` : ''}.`);
    (sh.zones || []).forEach((z) => list.push(`${z.name}: ${formatPrice(z.fee)}${z.eta ? ` (${z.eta})` : ''}${z.freeThreshold ? `, free over ${formatPrice(z.freeThreshold)}` : ''}.`));
  }
  const free = sh.enabled && sh.freeEnabled && sh.freeThreshold > 0
    ? `Orders of ${formatPrice(sh.freeThreshold)} or more (after discounts) qualify for free shipping.`
    : sh.enabled ? 'Delivery charges are shown at checkout before you confirm your order.' : 'Delivery is free.';

  return (
    <PolicyPage
      title="Shipping Policy"
      intro="How and when your order reaches you."
      sections={[
        { title: 'Delivery charges', body: free, list: list.length ? list : undefined },
        { title: 'Delivery time', body: sh.etaText ? `Most orders are delivered in ${sh.etaText}. Times can vary for remote areas.` : 'Delivery times depend on your city and are confirmed when we contact you about your order.' },
        { title: 'Payment on delivery', body: payment.codEnabled ? `Cash on Delivery is available${payment.codFee > 0 ? ` (fee: ${formatPrice(payment.codFee)})` : ''}. Please keep the exact amount ready.` : 'Cash on Delivery is currently not available.' },
        { title: 'Tracking', body: 'You can follow your order any time from the Track Order page using your order number and phone number.' },
      ]}
    />
  );
}
