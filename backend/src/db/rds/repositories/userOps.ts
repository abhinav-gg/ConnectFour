import pool from '../rdsClient';
import * as DBError from '@/db/dbErrors';
import { User, UserSchema, UserWithPassword, UserWithPasswordSchema } from '@/db/models/User';

export const UserOperations = {
  
  async __getAllUsers(): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, username, email, email_verified, created_at, updated_at, last_login
                FROM users`
    );
    return result.rows as User[];
  },

  // async createUser(
  //   username: string,
  //   email: string,
  //   passwordHash: string,
  //   isAnonymous: boolean = false
  // ): Promise<User> {
  //   const client = await this.getClient();
  //   const normUser = username.toLowerCase();
  //   const normEmail = email.toLowerCase();

  //   try {
  //     await client.query('BEGIN');

  //     // Check if username already exists
  //     const userCheckResult = await client.query(
  //       `SELECT id FROM Users WHERE username = $1`,
  //       [normUser]
  //     );

  //     if (userCheckResult.rows.length > 0) {
  //       throw new DBError.UsernameExists();
  //     }

  //     // Check if email already exists
  //     const emailCheckResult = await client.query(
  //       `SELECT id FROM Users WHERE email = $1`,
  //       [normEmail]
  //     );

  //     if (emailCheckResult.rows.length > 0) {
  //       throw new DBError.EmailExists();
  //     }
  //     // -------------------------------------------

  //     // Insert new user
  //     const result = await client.query(
  //       `INSERT INTO Users (username, email, password_hash, is_anonymous, created_at, updated_at)
  //        VALUES ($1, $2, $3, $4, NOW(), NOW())
  //        RETURNING id, username, email, email_verified, created_at, updated_at, last_login`,
  //       [normUser, normEmail, passwordHash, isAnonymous]
  //     );

  //     await client.query('COMMIT');

  //     return result.rows[0];
  //   } catch (error) {
  //     await client.query('ROLLBACK');
  //     //console.error('Failed to create user:', error);
  //     throw error;
  //   } finally {
  //     this.safeRelease();
  //   }
  // }

  async recordUserLogin(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users
        SET last_login = NOW()
        WHERE id = $1`,
      [userId]
    );
  },

  async getUserDataByUsername(username: string): Promise<User> {
    const result = await pool.query(
        `SELECT id, username, email, email_verified, created_at, updated_at, last_login
          FROM users
          WHERE username = $1`,
        [username.toLowerCase()]
      );

    return UserSchema.parse(result.rows[0]);
  },

  async updateUsernameByID(id: string, newUsername: string): Promise<void> {
    await pool.query(
      `UPDATE users
        SET username = $1, updated_at = NOW()
        WHERE id = $2`,
      [newUsername.toLowerCase(), id]
    );
  },

  async getUserByEmail(email: string): Promise<User> {
    const result = await pool.query(
      `SELECT id, username, email, email_verified, created_at, updated_at, last_login
               FROM users
               WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0];
  },

  async updateEmailByID(id: string, newEmail: string): Promise<void> {
    await pool.query(
      `UPDATE users
       SET email = $1, updated_at = NOW()
       WHERE id = $2`,
      [newEmail.toLowerCase(), id]
    );
  },

  async getUserByID(id: string): Promise<User> {
    const result = await pool.query(
      `SELECT * FROM users
          WHERE id = $1`,
      [id]
    );
    return result.rows[0] as User;
  },

  // allow login by username or email

  async getPasswordHashByUsername(username: string): Promise<string> {
    const result = await pool.query(
      `SELECT password_hash
               FROM users
               WHERE username = $1`,
      [username.toLowerCase()]
    );

    return result.rows[0]?.password_hash ?? "";
  },

  async getPasswordHashByEmail(email: string): Promise<string> {
    const result = await pool.query(
      `SELECT password_hash
               FROM users
               WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0]?.password_hash ?? "";
  },

  async getIDByUsername(username: string): Promise<string> {
    const result = await pool.query(
      `SELECT id
        FROM users
        WHERE username = $1`,
      [username.toLowerCase()]
    );

    return result.rows[0]?.id ?? "";
  },

  async dropUserByID(id: string): Promise<void> {
    // await this.revokeSessionByUID(id);
    // await pool.query(
    //   `UPDATE FROM users
    //     SET username = NULL, email = NULL, password_hash = NULL, email_verified = FALSE, updated_at = NOW()
    //     WHERE id = $1`,
    //   [id]
    // );
    // There is no delete query
  },

  async getIDByEmail(email: string): Promise<string> {
    const result = await pool.query(
      `SELECT id
        FROM users
        WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0]?.id ?? "";
  },

  async getAllUserTagNames(id: string): Promise<[string]> {
    const result = await pool.query(
      `SELECT utags.name
        FROM usertags INNER JOIN utags 
        ON utags.id = usertags.tag_id
        WHERE usertags.user_id = $1`,
      [id]
    );

    return result.rows.map((row) => row.name) as [string];
  },

  async checkForTag(userId: string, tagName: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM user_tags 
        WHERE user_id = $1 
        AND   tag_name = '$2' 
      LIMIT 1`,
      [userId, tagName]
    );
    return (result.rowCount ?? 0) > 0;
  },


  async assignUserTag(id: string, tag: string): Promise<void> {

    // id is the user uuid
    // tag = 'IM', 'Admin' etc

    //INSERT INTO usertags (user_id,tag_id) 
    //SELECT $1, id FROM utags WHERE name = $2;

    return;
  },

  async getAnonymousUser(): Promise<void> {
    // const client = await this.getClient();
    // try {
    //   await client.query('BEGIN');
    //   // Insert new user
    //   const result = await client.query(
    //     `INSERT INTO users (is_anonymous) VALUES (TRUE) RETURNING id`);
    //   await client.query('COMMIT');

    //   return result.rows[0];
    // } catch (error) {
    //   await client.query('ROLLBACK');
    //   //console.error('Failed to create anonymous user:', error);
    //   throw error;
    // } finally {
    //   this.safeRelease();
    // }

  },

  // Call this function to delete anonymous users that are older than 24 hours every day
  async CronDeleteAnonymousUsers(): Promise<void> {
    // await pool.query('BEGIN');
    // // Delete anonymous users
    // await pool.query(
    //   `DELETE FROM users
    //     WHERE is_anonymous = true
    //     AND NOT EXISTS ( SELECT id FROM GamePlayers WHERE player = users.id )
    //     AND NOT EXISTS ( SELECT id FROM GameLookup WHERE player = users.id );`
    // );
    // await pool.query('COMMIT');
  },
}