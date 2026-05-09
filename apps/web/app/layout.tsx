import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  description: 'Loopin helps travelers plan smart city itineraries with distance, cost, and hidden-gem context.',
  title: 'Loopin Planner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
