import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";

export class GameOperations {
    client: PoolClient | null = null;
  
    private async getClient(): Promise<PoolClient> {
      console.log(process.env.DB_URL);
      const pool = new Pool({
        connectionString: process.env.DB_URL,
        application_name: application_name
      });
  
      if (!this.client) {
        this.client = await pool.connect();
      }
  
      return this.client;
    }
  
    async getUserByUsername(username: string): Promise<Boolean> {
        const client = await this.getClient();
        try {
          const result = await client.query(
            `SELECT id, username, email, email_verified, created_at, updated_at, last_login
                     FROM con4_schema.users
                     WHERE username = $1`,
            [username]
          );
    
          return result.rows[0];
        } catch (error) {
          console.error('Failed to fetch user by username:', error);
          throw error;
        } finally {
          client.release();
          this.client = null;
        }
    }
}
  
