// Load all environment variables from .env file
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Define the environment variables and their types
export const myConfig = {

    
    PORT: process.env.PORT || '3001',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
    ADMIN_USER_ID: process.env.ADMIN_USER_ID || '',
    NODE_ENV: process.env.NODE_ENV || 'development',

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || '',
    RDS_CA_CERT: fs.readFileSync('./config/global-bundle.pem').toString(), // Path to the Amazon RDS root certificate

    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || '6379',

};
