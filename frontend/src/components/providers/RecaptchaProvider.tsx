'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from 'react-google-recaptcha-v3';

type RecaptchaContextType = {
  getRecaptchaToken: (action?: string) => Promise<string | null>;
  activateRecaptcha: () => void;
  isRecaptchaActive: boolean;
};

const RecaptchaContext = createContext<RecaptchaContextType | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
  siteKey: string;
};

export const RecaptchaProvider = ({ children, siteKey }: Props) => {
  // recaptcha active state
  const [active, setActive] = useState(false);

  // Function to activate recaptcha on demand
  const activateRecaptcha = useCallback(() => {
    setActive(true);
  }, []);

  return (
    <RecaptchaContext.Provider
      value={{ getRecaptchaToken: async () => null, activateRecaptcha, isRecaptchaActive: active }}
    >
      {/* Conditionally render recaptcha provider */}
      {active ? (
        <GoogleReCaptchaProvider
          reCaptchaKey={siteKey}
          scriptProps={{ async: true, defer: true }}
        >
          <InnerRecaptchaContextProvider activateRecaptcha={activateRecaptcha}>
            {children}
          </InnerRecaptchaContextProvider>
        </GoogleReCaptchaProvider>
      ) : (
        children
      )}
    </RecaptchaContext.Provider>
  );
};

const InnerRecaptchaContextProvider = ({
  children,
  activateRecaptcha,
}: {
  children: ReactNode;
  activateRecaptcha: () => void;
}) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  // This function will be exposed to consumers
  const getToken = useCallback(
    async (action: string = 'submit'): Promise<string | null> => {
      if (!executeRecaptcha) {
        console.warn('Recaptcha not ready yet');
        return null;
      }
      try {
        return await executeRecaptcha(action);
      } catch (error) {
        console.error('Recaptcha execution error', error);
        return null;
      }
    },
    [executeRecaptcha]
  );

  // Override the context with the real getToken and activateRecaptcha
  return (
    <RecaptchaContext.Provider value={{ getRecaptchaToken: getToken, activateRecaptcha, isRecaptchaActive: true }}>
      {children}
    </RecaptchaContext.Provider>
  );
};

// Hook to consume context
export const useRecaptcha = (): RecaptchaContextType => {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
};
