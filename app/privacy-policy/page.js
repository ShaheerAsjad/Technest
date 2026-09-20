import PolicyPage from '@/components/PolicyPage';
import { getStoreSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy Policy — TechNest' };

export default async function PrivacyPage() {
  const { store } = await getStoreSettings();
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`This policy explains what information ${store.name} collects when you use our website and how we use it.`}
      sections={[
        { title: 'Information we collect', body: 'When you create an account or place an order we collect your name, email address, phone number, delivery address and order details. We also keep basic technical information (such as browser type) to keep the site secure and working.' },
        { title: 'How we use it', body: 'We use your information to process and deliver orders, contact you about your order, provide customer support, prevent fraud and improve our store.' },
        { title: 'Sharing', body: 'We only share the details needed to complete your order with delivery partners and service providers (for example sign-in and email services). We never sell your personal information.' },
        { title: 'Cookies and local storage', body: 'We store your cart, wishlist and theme preference in your browser so they are remembered between visits.' },
        { title: 'Your choices', body: 'You can ask us to correct or delete your account information at any time by contacting us.' },
      ]}
    />
  );
}
