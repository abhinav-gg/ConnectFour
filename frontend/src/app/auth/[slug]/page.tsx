import { notFound } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ResetForm from '@/components/auth/ResetForm';

const forms: Record<string, JSX.Element> = {
  login: <LoginForm />,
  register: <RegisterForm />,
  reset: <ResetForm />,
};

export default function AuthSlugPage({ params }: { params: { slug: string } }) {
  const form = forms[params.slug];

  if (!form) notFound();

  return (
    <div className="auth-container">
      <h1 className="auth-title">{params.slug}</h1>
      {form}
    </div>
  );
}
