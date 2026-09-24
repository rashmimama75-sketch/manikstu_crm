import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manikstu Staff Portal',
  description: 'Odisha agri-business network staff portal for managers and telecalling staff.',
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
