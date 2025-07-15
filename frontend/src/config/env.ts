// Load all environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Define the environment variables and their types
export const myConfig = {
    
    NODE_ENV: process.env.NODE_ENV || 'development',

    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:3001",
    WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001/",
  
    DISCORD_REDIRECT_URI: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
    RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    
};
