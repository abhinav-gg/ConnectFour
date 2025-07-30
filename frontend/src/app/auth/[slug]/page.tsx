import { notFound } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms/login';
import { RegisterForm } from '@/components/auth/forms/register';
import { ResetPasswordForm } from '@/components/auth/forms/pwd-reset';
import { VerifyEmailForm } from '@/components/auth/forms/verify-email';
import { LogoutUser } from '@/components/auth/forms/logout';
import { BoardSpaceLayout } from '@/components/board-space-layout';

const forms: Record<string, JSX.Element> = {
  "login": <LoginForm />,
  "register": <RegisterForm />,
  "reset-pwd": <ResetPasswordForm />,
  "verify-email": <VerifyEmailForm />,
  "logout": <LogoutUser />
};

interface PageProps {
  params: { slug: string };
}

const AuthSlugPage = async({ params }: PageProps) => {
  const form = forms[(await params).slug];

  if (!form) notFound();

  return (
    <BoardSpaceLayout
      boardColumnRatio="50%">
      {form}
    </BoardSpaceLayout>
  )
}

export default AuthSlugPage
