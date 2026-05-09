import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';

import './globals.css';

export const metadata: Metadata = {
  description: 'Loopin helps travelers plan smart city trips with discovery, collaboration, and smart itinerary tools.',
  title: 'Loopin - Smart Travel Planning',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem>
          <AuthProvider session={session}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
