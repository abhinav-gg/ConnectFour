import dotenv from 'dotenv';

declare global {
  interface Window {
    NEXT_PUBLIC_BACKEND_URL?: string;
  }
}

dotenv.config();

export const getConfig = () => {
  return {
    backendUrl: window.__NEXT_DATA__?.props?.pageProps?.backendUrl || 
                process.env.NEXT_PUBLIC_BACKEND_URL || 
                window.NEXT_PUBLIC_BACKEND_URL ||
                ''
  }
}

// Debug only during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!getConfig().backendUrl) {
    console.warn('Backend URL is not set in runtime environment');
  }
} 