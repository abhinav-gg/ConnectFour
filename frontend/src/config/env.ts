import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file with explicit path
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.local')
});

export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || ''
} 

// Add this for debugging
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set in environment variables');
  console.log('Current environment variables:', process.env);
  console.log('Current working directory:', process.cwd());
} 