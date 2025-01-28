import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Con4 - Play Four In A Row Online',
  description: 'A competitive and fun online Four-In-A-Row game built with analysis, opening books and so much more! Four In A Row',
  icons: {
    icon: '/logo.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:type" content="website" />
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}