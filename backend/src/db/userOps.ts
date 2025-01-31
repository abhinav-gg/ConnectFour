import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { User } from '@/models/User';
import * as DBError from './dbErrors';

// Load .env from project root
dotenv.config({ path: "../../.env" });
export const application_name = "con-four";

export class UserOperations {
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
    const normUser = username.toLowerCase();
    const normEmail = email.toLowerCase();

    try {
      await client.query('BEGIN');

      // Check if username already exists
      const userCheckResult = await client.query(
        `SELECT id FROM con4_schema.Users WHERE username = $1`,
        [normUser]
      );

      if (userCheckResult.rows.length > 0) {
        throw new DBError.UsernameExists();
      }

      // Check if email already exists
      const emailCheckResult = await client.query(
        `SELECT id FROM con4_schema.Users WHERE email = $1`,
        [normEmail]
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
        [normUser, normEmail, passwordHash, isAnonymous]
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
        [username.toLowerCase()]
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

  async updateUsernameByID(id: string, newUsername: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE con4_schema.users
         SET username = $1, updated_at = NOW()
         WHERE id = $2`,
        [newUsername.toLowerCase(), id]
      );
    } catch (error) {
      console.error('Failed to update username by ID:', error);
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
        [email.toLowerCase()]
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

  async updateEmailByID(id: string, newEmail: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE con4_schema.users
         SET email = $1, updated_at = NOW()
         WHERE id = $2`,
        [newEmail.toLowerCase(), id]
      );
    } catch (error) {
      console.error('Failed to update email by ID:', error);
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
        `SELECT * FROM con4_schema.users
            WHERE id = $1`,
        [id]
      );
      return result.rows[0] as User;
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
        [username.toLowerCase()]
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
        [email.toLowerCase()]
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
        [username.toLowerCase()]
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
        [email.toLowerCase()]
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

  async getAllUserTagNames(id: string): Promise<[string]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT con4_schema.utags.name
          FROM con4_schema.usertags INNER JOIN con4_schema.utags 
          ON con4_schema.utags.id = con4_schema.usertags.tag_id
          WHERE con4_schema.usertags.user_id = $1`,
        [id]
      );

      return result.rows.map((row) => row.name) as [string];
    } catch (error) {
      console.error('Failed to fetch all user tag names:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async assignUserTag(id: string, tag: string): Promise<void> {

    // id is the user uuid
    // tag = 'IM', 'Admin' etc

    //INSERT INTO con4_schema.usertags (user_id,tag_id) 
    //SELECT $1, id FROM con4_schema.utags WHERE name = $2;

    return;
  }

  async getAnonymousUser(): Promise<User> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      // Insert new user
      const result = await client.query(
        `INSERT INTO con4_schema.users (is_anonymous) VALUES (TRUE) RETURNING id`);
      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to create anonymous user:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }

  }

  // Call this function to delete anonymous users that are older than 24 hours every day
  async CronDeleteAnonymousUsers(): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      // Delete anonymous users
      await client.query(
        `DELETE FROM con4_schema.users
          WHERE is_anonymous = true
          AND NOT EXISTS ( SELECT id FROM con4_schema.GamePlayers WHERE player = con4_schema.users.id )
          AND NOT EXISTS ( SELECT id FROM con4_schema.GameLookup WHERE player = con4_schema.users.id );`
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to delete anonymous users:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

/////////////////////////////////////////////////////////////////////////////////////////////

  async createUserSession(id: string, token: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `INSERT INTO con4_schema.sessions (user_id, token, expires)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')
         ON CONFLICT (user_id) DO UPDATE SET token = $2, expires = NOW() + INTERVAL '7 days'`,
        [id, token]
      );
    } catch (error) {
      console.error('Failed to create user session:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async revokeSessionByUID(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `DELETE FROM con4_schema.sessions
          WHERE user_id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Failed to revoke user session:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async revokeSessionByToken(token: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `DELETE FROM con4_schema.sessions
          WHERE token = $1`,
        [token]
      );
    } catch (error) {
      console.error('Failed to revoke user session:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getUserFromSession(token: string): Promise<string | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT user_id FROM con4_schema.sessions
         WHERE token = $1`,
        [token]
      );

      const sessionExists = result.rows.length > 0;
      if (!sessionExists) {
        return null;
      }

      const expired = result.rows[0].expires < new Date();
      if (expired) {
        await this.revokeSessionByToken(token);
        return null;
      }

      return result.rows[0].user_id;
    } catch (error) {
      console.error('Failed to check user session:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async getSessionFromUserId(id: string): Promise<string | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT token FROM con4_schema.sessions
         WHERE user_id = $1`,
        [id]
      );

      return result.rows[0]?.token ?? null;
    } catch (error) {
      console.error('Failed to check user session:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  //DELETE FROM con4_schema.users 
  //WHERE username IS NULL;
}