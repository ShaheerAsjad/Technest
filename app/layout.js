import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import Providers from './providers';

export const metadata = {
  title: 'TechNest — Tech Products Store',
  description: 'Phones, laptops, gaming gear, and accessories — all in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main id="page-root">{children}</main>
          <Footer />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
