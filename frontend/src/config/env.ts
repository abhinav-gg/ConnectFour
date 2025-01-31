import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const getConfig = () => {
  const config = {
    recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '', // Read from .env or keep empty
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '', // Read from .env or keep empty
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', // Read from .env or keep empty
    mode: process.env.NEXT_PUBLIC_NODE_ENV || 'development', // !! Ensure this is set to 'production' in production environment
    discordRedirectUri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || '', // Read from .env or keep empty
  };

  return config;
};

// Debug only during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!getConfig().backendUrl) {
    console.warn('Backend URL is not set in runtime environment');
  }
} 