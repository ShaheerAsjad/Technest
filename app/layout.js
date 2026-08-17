import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import IntroLoader from '@/components/IntroLoader';
import AmbientGlow from '@/components/AmbientGlow';
import Providers from './providers';

export const metadata = {
  title: 'TechNest — Tech Products Store',
  description: 'Phones, laptops, gaming gear, and accessories — all in one place.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <IntroLoader />
          <Providers>
            <AmbientGlow />
            <Navbar />
            <main id="page-root">{children}</main>
            <Footer />
            <BackToTop />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
