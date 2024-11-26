import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function testDatabase() {

    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        application_name: "connect"
    });

    const statements = [
        // Create users table if it doesn't exist
        `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username STRING(50) NOT NULL,
            email STRING(255) NOT NULL,
            password_hash STRING(255) NOT NULL,
            created_at TIMESTAMP DEFAULT current_timestamp(),
            updated_at TIMESTAMP DEFAULT current_timestamp(),
            last_login TIMESTAMP,
            UNIQUE(username),
            UNIQUE(email)
        )`,
        // Insert a test user
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, email, created_at`
    ];

    try {
        console.log('Connecting to CockroachDB...');
        await client.connect();
        console.log('Connected successfully');

        // Create table if not exists
        console.log('Creating table if not exists...');
        await client.query(statements[0]);

        // Insert test user
        console.log('Inserting test user...');
        const testUser = {
            username: `testuser_${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password_hash: `dummy_hash_${Date.now()}`
        };

        const result = await client.query(statements[1], [
            testUser.username,
            testUser.email,
            testUser.password_hash
        ]);

        console.log('Successfully inserted user');
        return result.rows[0];

    } catch (error: any) {
        console.error('Detailed error information:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Database connection details:', {
            host: process.env.PGHOST,
            port: process.env.PGPORT,
            database: process.env.PGDATABASE,
            user: process.env.PGUSER,
            // Don't log password for security
        });
        
        throw error;
    } finally {
        if (client) {
            console.log('Releasing database connection');
            client.end();
        }
    }
}
