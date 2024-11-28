import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file with explicit path
dotenv.config({ 
  path: path.resolve(__dirname, '../../.env')
});

export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || ''
} 

// Add this for debugging
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set in environment variables');
  console.log('Current environment variables:', process.env);
  console.log('Current working directory:', process.cwd());
  console.log('Resolved .env path:', path.resolve(__dirname, '../../.env'));
} 