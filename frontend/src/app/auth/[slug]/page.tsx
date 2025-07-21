import { notFound } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms/login';
import { RegisterForm } from '@/components/auth/forms/register';
import { ResetPasswordForm } from '@/components/auth/forms/pwd-reset';
import { VerifyEmailForm } from '@/components/auth/forms/verify-email';

const forms: Record<string, JSX.Element> = {
  "login": <LoginForm />,
  "register": <RegisterForm />,
  "reset-pwd": <ResetPasswordForm />,
  "verify-email": <VerifyEmailForm />,
};

export default function AuthSlugPage({ params }: { params: { slug: string } }) {
  const form = forms[params.slug];

  if (!form) notFound();

  return form;
}
