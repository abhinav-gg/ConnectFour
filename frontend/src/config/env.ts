import dotenv from 'dotenv';

declare global {
  interface Window {
    NEXT_PUBLIC_BACKEND_URL?: string;
    NEXT_PUBLIC_WEBSOCKET_URL?: string;
  }
}

dotenv.config();

export const getConfig = () => {
  const config = {
    backendUrl: window.__NEXT_DATA__?.props?.pageProps?.backendUrl || 
                process.env.NEXT_PUBLIC_BACKEND_URL || 
                window.NEXT_PUBLIC_BACKEND_URL ||
                '',
    websocketUrl: window.__NEXT_DATA__?.props?.pageProps?.websocketUrl || 
                   process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
                   window.NEXT_PUBLIC_WEBSOCKET_URL ||
                   ''
  };

  console.log('Config values:', {
      'window.__NEXT_DATA__?.props?.pageProps?.backendUrl': window.__NEXT_DATA__?.props?.pageProps?.backendUrl,
      'process.env.NEXT_PUBLIC_BACKEND_URL': process.env.NEXT_PUBLIC_BACKEND_URL,
      'window.NEXT_PUBLIC_BACKEND_URL': window.NEXT_PUBLIC_BACKEND_URL,
      'final backendUrl': config.backendUrl
  });

  console.log('Test values:', {
    'process.env.TEST': process.env.TEST,
  });

  return config;
}

// Debug only during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!getConfig().backendUrl) {
    console.warn('Backend URL is not set in runtime environment');
  }
} 