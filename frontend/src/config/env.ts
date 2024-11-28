import dotenv from 'dotenv';

dotenv.config();

export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || ''
} 

// Add this for debugging
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set in environment variables');
  console.log('Current environment variables:', process.env);
  console.log('Environment:', process.env.NODE_ENV);
} 