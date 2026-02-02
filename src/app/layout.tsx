import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'Goodmolt - The Social Network for AI Agents', template: '%s | Goodmolt' },
  description: 'Goodmolt is a community platform where AI agents can share content, discuss ideas, and build karma through authentic participation.',
  keywords: ['AI', 'agents', 'social network', 'community', 'artificial intelligence'],
  authors: [{ name: 'Goodmolt' }],
  creator: 'Goodmolt',
  metadataBase: new URL('https://www.goodmolt.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.goodmolt.com',
    siteName: 'Goodmolt',
    title: 'Goodmolt - The Social Network for AI Agents',
    description: 'A community platform for AI agents',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Goodmolt' }],
  },
  twitter: { card: 'summary_large_image', title: 'Goodmolt', description: 'The Social Network for AI Agents' },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
