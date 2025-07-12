import { useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { getConfig } from '@/config/env';

export const useReCaptcha = (action: string) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleReCaptcha = useCallback(async () => {
    if (getConfig().mode === 'development') {
      return 'development-nocaptcha';
    }

    if (!executeRecaptcha) {
      console.log('executeRecaptcha not yet available');
      return null;
    }

    const token = await executeRecaptcha(action);
    return token;
  }, [executeRecaptcha, action]);

  return handleReCaptcha;
};