import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import './atlantic.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import AmbientGlow from '@/components/AmbientGlow';
import CommandPalette from '@/components/CommandPalette';
import RouteLoader from '@/components/RouteLoader';
import AnnouncementBar from '@/components/AnnouncementBar';
import CategoryDrawer from '@/components/CategoryDrawer';
import CartDrawer from '@/components/CartDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import ChatAssistant from '@/components/ChatAssistant';
import Providers from './providers';
import { getCategoryTree } from '@/lib/catalog';
import { getStoreSettings } from '@/lib/settings';

export const metadata = {
  title: 'TechNest — Networking, CCTV & Tech Marketplace',
  description: 'Fiber, networking, CCTV and IT hardware from trusted brands, plus phones, laptops and gaming gear. Shop online at TechNest.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  // Both helpers NEVER throw: if the database is down the shell still renders.
  const [tree, settings] = await Promise.all([getCategoryTree(), getStoreSettings()]);

  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <Providers>
            <Suspense fallback={null}>
              <RouteLoader />
            </Suspense>
            <AmbientGlow />
            <AnnouncementBar enabled={settings.announcement.enabled} messages={settings.announcement.messages} />
            <Navbar tree={tree} />
            <CommandPalette />
            <CategoryDrawer tree={tree} phone={settings.store.phone} />
            <CartDrawer />
            <main id="page-root">{children}</main>
            <Footer tree={tree} store={settings.store} />
            <MobileBottomNav />
            <ChatAssistant store={settings.store} />
            <BackToTop />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
