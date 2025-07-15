import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WebSocketProvider } from '@/components/websocketProvider';
import { myConfig } from '@/config/env';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Con4 - Play Four In A Row Online',
  description: 'A competitive and fun online Four-In-A-Row game built with analysis, opening books and so much more! Play Four In a Row today!',
  icons: {
    icon: '/logo.ico',
  },
};

// Websocket Provider Wrapper!

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Con4" />
      <meta property="og:title" content="Con4 - Play Four In A Row Online" />
      <meta property="og:description" content="A competitive and fun online Four-In-A-Row game built with analysis, opening books and so much more! Play Four In a Row today!" />
      <body className={inter.className}>
        <WebSocketProvider url={myConfig.WEBSOCKET_URL}>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}