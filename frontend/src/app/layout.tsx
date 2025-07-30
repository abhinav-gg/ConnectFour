import './globals.css';
import type { Metadata } from 'next';
import { myConfig } from '@/config/env';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { UserProvider } from '@/components/providers/userProvider';
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider';

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
      <body>
        <SocketProvider url={myConfig.WEBSOCKET_URL}>
          <RecaptchaProvider siteKey={myConfig.RECAPTCHA_SITE_KEY}>
            <UserProvider>
              {children}
            </UserProvider>
          </RecaptchaProvider>
        </SocketProvider>
      </body>
    </html>
  );
}