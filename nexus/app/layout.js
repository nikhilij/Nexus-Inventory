import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Nexus Inventory',
  description: 'Inventory management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header isAuthenticated={false} />
        <main id="content">{children}</main>
        <Footer isAuthenticated={false} />
      </body>
    </html>
  );
}
