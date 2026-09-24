import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maniksthu Manager Dashboard',
  description: 'Odisha agri-business network territory manager portal for orders, leads, staff onboarding, inventory and financial oversight.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
