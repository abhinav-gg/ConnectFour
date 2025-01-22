import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { getConfig } from '@/config/env'

const inter = Inter({ subsets: ['latin'] })
const config = getConfig()

export const metadata: Metadata = {
  title: 'Connect Four',
  description: 'A fun Connect Four game built with Next.js and React',
  icons: {
    icon: '/logo.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey}>
          {children}
        </GoogleReCaptchaProvider>
      </body>
    </html>
  )
}