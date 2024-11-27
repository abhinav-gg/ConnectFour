import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/'
} 