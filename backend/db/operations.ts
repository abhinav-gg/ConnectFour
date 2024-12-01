import { Client } from 'pg';
import dotenv from 'dotenv';
import { User } from '@/models/User';

// Load .env from project root
dotenv.config();

class DatabaseOperations {
    private async getClient() {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            application_name: "connect_four_app"
        });
        await client.connect();
        return client;
    }

    async createUser(username: string): Promise<User> {
        const client = await this.getClient();
        try {
            const email = `${username.toLowerCase()}_${Date.now()}@example.com`;
            const password_hash = `dummy_hash_${Date.now()}`;

            const result = await client.query(
                `INSERT INTO users (username, email, password_hash) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, username, email, created_at`,
                [username, email, password_hash]
            );

            return result.rows[0];
        } finally {
            await client.end();
        }
    }

    async getAllUsers(): Promise<User[]> {
        const client = await this.getClient();
        try {
            const result = await client.query(
                'SELECT id, username, email, created_at, updated_at, last_login FROM users ORDER BY created_at DESC'
            );
            return result.rows;
        } finally {
            await client.end();
        }
    }

    async query<T>(queryText: string, params?: any[]): Promise<T[]> {
        const client = await this.getClient();
        try {
            const result = await client.query(queryText, params);
            return result.rows;
        } finally {
            await client.end();
        }
    }
}

const databaseOps = new DatabaseOperations();

export const dbOperations = {
    query: databaseOps.query.bind(databaseOps),
    createUser: databaseOps.createUser.bind(databaseOps),
    getAllUsers: databaseOps.getAllUsers.bind(databaseOps),
    // ... other operations
};
