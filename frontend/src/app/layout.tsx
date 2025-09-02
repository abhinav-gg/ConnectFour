import './globals.css';
import type { Metadata } from 'next';
import { myConfig } from '@/config/env';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider';
import { ErrorProvider } from '@/components/providers/ErrorProvider';
import { Suspense } from 'react';
import Loading from '@/components/loading';
import { AppHooksProvider } from '@/components/providers/AppHooksProvider';
import { BackendProvider } from '@/components/providers/BackendProvider';

export const metadata: Metadata = {
  title: 'Con4 - Play Four In A Row Online',
  description: 'A competitive and fun online Four-In-A-Row game built with analysis, opening books and so much more! Play Four In a Row today!',
  icons: {
    icon: '/logo.ico',
  },
};

export const version = "1.0.beta"

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
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <body>
        <AppHooksProvider>
          <ErrorProvider>
            <SocketProvider url={myConfig.WEBSOCKET_URL}>
              <BackendProvider>
                <RecaptchaProvider siteKey={myConfig.RECAPTCHA_SITE_KEY}>
                        <Suspense fallback={<Loading />}>
                          {children}
                        </Suspense>
                </RecaptchaProvider>
              </BackendProvider>
            </SocketProvider>
          </ErrorProvider>
        </AppHooksProvider>
      </body>
    </html>
  );
}