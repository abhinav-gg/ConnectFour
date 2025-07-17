// Load all environment variables from .env file
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Define the environment variables and their types
export const myConfig = {
    
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    PORT: process.env.PORT || '3001',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_RECAPTCHA_SECRET_KEY: process.env.GOOGLE_RECAPTCHA_SECRET_KEY || '',
    GOOGLE_CLIENT_REDIRECT_URI: process.env.GOOGLE_CLIENT_REDIRECT_URI || 'http://localhost:3001/auth/google/callback', // Update to your backend OAuth2 callback URL

    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',


    RDS_HOST: process.env.RDS_HOST || 'localhost',
    RDS_PORT: process.env.RDS_PORT || '5432',
    RDS_USER: process.env.RDS_USER || 'postgres',
    RDS_PASSWORD: process.env.RDS_PASSWORD || '',
    RDS_NAME: process.env.RDS_NAME || '',
    RDS_CA_CERT: fs.readFileSync('./config/global-bundle.pem').toString(), // Path to the Amazon RDS root certificate

    REDIS_HOST: process.env.REDIS_HOST || 'localhost', // hosted by docker-compose
    REDIS_PORT: process.env.REDIS_PORT || '6379',

    ZOHO_USER: process.env.ZOHO_USER || '',
    ZOHO_PWD: process.env.ZOHO_PWD || '',

    DYNAMODB_ACCESS: process.env.DYNAMODB_ACCESS || 'local',
    DYNAMODB_PWD: process.env.DYNAMODB_PWD || '',
};
