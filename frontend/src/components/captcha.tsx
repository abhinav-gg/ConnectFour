import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { getConfig } from '@/config/env';
import { ReactNode } from 'react';

interface ReCaptchaWrapperProps {
  children: ReactNode;
}

export const ReCaptchaWrapper = ({ children }: ReCaptchaWrapperProps) => {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={getConfig().recaptchaSiteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
};