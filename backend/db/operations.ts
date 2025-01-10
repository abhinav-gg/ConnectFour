import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { User } from '@/models/User';
import * as DBError from './errors';
import { OpeningOperations } from './dbOpenings';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";

class UserOperations {
  client: PoolClient | null = null;

  private async getClient(): Promise<PoolClient> {
    const pool = new Pool({
      connectionString: process.env.DB_URL,
      application_name: application_name
    });

    if (!this.client) {
      this.client = await pool.connect();
    }

    return this.client;
  }

  async __getAllUsers(): Promise<User[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT id, username, email, created_at, email_verified, updated_at, last_login FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async createUser(
    username: string,
    email: string,
    passwordHash: string,
    isAnonymous: boolean = false
  ): Promise<User> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');

      // Check if username already exists
      const userCheckResult = await client.query(
        `SELECT id FROM con4_schema.Users WHERE username = $1`,
        [username]
      );

      if (userCheckResult.rows.length > 0) {
        throw new DBError.UsernameExists();
      }

      // Check if email already exists
      const emailCheckResult = await client.query(
        `SELECT id FROM con4_schema.Users WHERE email = $1`,
        [email]
      );

      if (emailCheckResult.rows.length > 0) {
        throw new DBError.EmailExists();
      }
      // -------------------------------------------

      // Insert new user
      const result = await client.query(
        `INSERT INTO con4_schema.Users (username, email, password_hash, is_anonymous, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, username, email, email_verified, created_at, updated_at, last_login`,
        [username, email, passwordHash, isAnonymous]
      );

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to create user:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async recordUserLogin(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE users
                 SET last_login = NOW()
                 WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Failed to record user login:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getUserByUsername(username: string): Promise<User> {
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

  async getUserByEmail(email: string): Promise<User> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id, username, email, email_verified, created_at, updated_at, last_login
                 FROM con4_schema.users
                 WHERE email = $1`,
        [email]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to fetch user by email:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getUserByID(id: string): Promise<User> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id, username, email, email_verified, created_at, updated_at, last_login, is_anonymous
                 FROM con4_schema.users
                 WHERE id = $1`,
        [id]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to fetch user by ID:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // allow login by username or email

  async getPasswordHashByUsername(username: string): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT password_hash
                 FROM con4_schema.users
                 WHERE username = $1`,
        [username]
      );

      return result.rows[0]?.password_hash ?? "";
    } catch (error) {
      console.error('Failed to fetch password hash by username:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getPasswordHashByEmail(email: string): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT password_hash
                 FROM users
                 WHERE email = $1`,
        [email]
      );

      return result.rows[0]?.password_hash ?? "";
    } catch (error) {
      console.error('Failed to fetch password hash by email:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getIDByUsername(username: string): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id
                 FROM users
                 WHERE username = $1`,
        [username]
      );

      return result.rows[0]?.id ?? "";
    } catch (error) {
      console.error('Failed to fetch id by username:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getIDByEmail(email: string): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id
                 FROM users
                 WHERE email = $1`,
        [email]
      );

      return result.rows[0]?.id ?? "";
    } catch (error) {
      console.error('Failed to fetch id by email:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }
}

const databaseOps = new UserOperations();
const openingOps = new OpeningOperations();

export const dbOperations = {
  // deprecated, remove ASAP
  __getAllUsers: databaseOps.__getAllUsers.bind(databaseOps),
  // new
  createUser: databaseOps.createUser.bind(databaseOps),
  recordUserLogin: databaseOps.recordUserLogin.bind(databaseOps),
  getUserByUsername: databaseOps.getUserByUsername.bind(databaseOps),
  getUserByEmail: databaseOps.getUserByEmail.bind(databaseOps),
  getPasswordHashByUsername: databaseOps.getPasswordHashByUsername.bind(databaseOps),
  getPasswordHashByEmail: databaseOps.getPasswordHashByEmail.bind(databaseOps),
  getIDByUsername: databaseOps.getIDByUsername.bind(databaseOps),
  getIDByEmail: databaseOps.getIDByEmail.bind(databaseOps),
  getUserByID: databaseOps.getUserByID.bind(databaseOps),


  GetOpening: openingOps.GetOpening.bind(openingOps),
};
