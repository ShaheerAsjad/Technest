import { ClerkProvider } from '@clerk/nextjs';
import { headers } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import AmbientGlow from '@/components/AmbientGlow';
import CommandPalette from '@/components/CommandPalette';
import Providers from './providers';

export const metadata = {
  title: 'TechNest — Premium Tech Marketplace',
  description: 'Phones, laptops, gaming gear, and accessories — curated for the future. Shop the latest tech at TechNest.',
};

export default async function RootLayout({ children }) {
  // Read the pathname injected by middleware to detect admin routes.
  // This lets us hide the public Navbar/Footer without a client-side hook.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

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
            {!isAdminRoute && <AmbientGlow />}
            {!isAdminRoute && <Navbar />}
            {!isAdminRoute && <CommandPalette />}
            <main id="page-root">{children}</main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <BackToTop />}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
