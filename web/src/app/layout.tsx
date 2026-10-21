import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Factory Brain — Production Management SaaS',
  description: 'Autonomous demand forecasting, net requirement planning, and machine scheduling.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-surface-bg text-slate-100 flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
