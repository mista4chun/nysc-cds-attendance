import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ThemeProvider } from 'next-themes';
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'NYSC CDS Attendance',
  description: 'CDS attendance management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NYSC Attend',
  },
   icons: {
    icon:        '/logo.png',
    apple:       '/icons/apple-icon-180.png',
    shortcut:    '/logo.png',
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
     <head>
  <link rel="preload" href="/logo.png" as="image" />
  <link rel="apple-touch-icon" href="/icons/icon-180.png" />
  <meta name="theme-color" content="#006400" />
</head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

