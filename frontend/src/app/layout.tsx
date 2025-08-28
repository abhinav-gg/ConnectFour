import './globals.css';
import type { Metadata } from 'next';
import { myConfig } from '@/config/env';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { UserProvider } from '@/components/providers/userProvider';
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider';
import { ErrorProvider } from '@/components/providers/errorProvider';
import { GameSessionProvider } from '@/components/providers/gameProvider';
import { Suspense } from 'react';

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
    <html lang="en" className="scrollbar-custom bg-brand-primary">
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Con4" />
      <meta property="og:title" content="Con4 - Play Four In A Row Online" />
      <meta property="og:description" content="A competitive and fun online Four-In-A-Row game built with analysis, opening books and so much more! Play Four In a Row today!" />
      <body>
        <ErrorProvider>
          <SocketProvider url={myConfig.WEBSOCKET_URL}>
            <GameSessionProvider>
              <RecaptchaProvider siteKey={myConfig.RECAPTCHA_SITE_KEY}>
                <UserProvider>
                  <GameSessionProvider>
                    <Suspense fallback={<div>Loading... Nicer Loading Coming Soon...</div>}>
                      {children}
                    </Suspense>
                  </GameSessionProvider>
                </UserProvider>
              </RecaptchaProvider>
            </GameSessionProvider>
          </SocketProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}