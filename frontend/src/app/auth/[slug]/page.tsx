// app/auth/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms/login';
import { RegisterForm } from '@/components/auth/forms/register';
import { ResetPasswordForm } from '@/components/auth/forms/pwd-reset';
import { VerifyEmailForm } from '@/components/auth/forms/verify-email';
import { LogoutUser } from '@/components/auth/forms/logout';
import { UnifiedGameLayout } from '@/components/layouts/game-layout';

const forms: Record<string, JSX.Element> = {
  'login': <LoginForm />,
  'register': <RegisterForm />,
  'reset-pwd': <ResetPasswordForm />,
  'verify-email': <VerifyEmailForm />,
  'logout': <LogoutUser />,
};

// Static paths for export
export async function generateStaticParams() {
  return Object.keys(forms).map((slug) => ({ slug }))
}

// Required for SSG-compatible dynamic routes
export const dynamic = 'force-static'

// ✅ FIXED: Treat `params` as a Promise
export default async function AuthSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const form = forms[resolvedParams.slug]

  if (!form) return notFound()

  return (
    <UnifiedGameLayout
      layout={{
        showScoreBar: false,
        showTimers: false,
        showPlayerInfo: false,
        contentRatio: "50%"
      }}
      board={{
        interactive: false,
        boardState: Array(6).fill(null).map(() => Array(7).fill(null)),
        gameOver: false,
        animate_init: false,
      }}
    >
      {form}
    </UnifiedGameLayout>
  )
}