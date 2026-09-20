import PolicyPage from '@/components/PolicyPage';
import { getStoreSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Terms of Service — TechNest' };

export default async function TermsPage() {
  const { store } = await getStoreSettings();
  return (
    <PolicyPage
      title="Terms of Service"
      intro={`By using the ${store.name} website and placing an order you agree to the terms below.`}
      sections={[
        { title: 'Orders', body: 'An order is confirmed once we contact you (or send a status update) after you place it. We may cancel an order if an item is unavailable, a price was listed in error, or we cannot verify the delivery details; in that case you will be told promptly.' },
        { title: 'Prices and availability', body: 'Prices are shown in Pakistani Rupees (Rs.). Prices and stock levels can change without notice; the price at the time you place the order applies.' },
        { title: 'Payment', body: 'Orders are paid by the payment methods shown at checkout, such as Cash on Delivery or bank transfer.' },
        { title: 'Product information', body: 'We try to keep descriptions and images accurate. Manufacturers may change specifications; images are for illustration.' },
        { title: 'Accounts', body: 'You are responsible for keeping your account credentials safe and for activity under your account.' },
        { title: 'Changes', body: 'We may update these terms from time to time. Continued use of the site means you accept the updated terms.' },
      ]}
    />
  );
}
