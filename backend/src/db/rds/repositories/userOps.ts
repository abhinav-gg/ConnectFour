import pool from '../rdsClient';
import { User, UserSchema, RegUser, UserRegistration } from '@/db/models/User';
import { withTransaction } from '../utils/withTransaction';
import * as DBError from '@/types/dbErrors';
import { UserAccountProvider } from "@shared/types/users";
import { UUID } from 'crypto';

export const UserOperations = {
  
  async __getAllUsers(): Promise<User[]> {
    const result = await pool.query(
      `SELECT *
        FROM users`
    );
    return result.rows as User[];
  },

  async createUser(
    normUser: string,
    normEmail: string,
    mailProvider: UserAccountProvider,
    emailVerified?: boolean,
    profilePic?: string,
    pwdHash?: string
  ): Promise<void> {

    return withTransaction(async (client) => {

      try {

        await client.query(
          `INSERT INTO users (username, email, email_verified, profile_pic, password_hash, mail_provider)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [normUser, normEmail, emailVerified, profilePic, pwdHash, mailProvider]
        );
      }
      catch (error: any) {
        // detect error type here
        // this will be a psql insert error
        console.error('Error creating user:', error);
        if (error.code === '23505') {
          // duplicate key error
          
          const usernameExists = await client.query(
            `SELECT 1 FROM users WHERE username = $1`,
            [normUser]
          );

          if (usernameExists.rowCount && usernameExists.rowCount > 0) {
            throw new DBError.UsernameExists();
          }

          throw new DBError.EmailExists();
          
        }
        throw error;
      }

      return

    });
  },

  async recordUserLogin(userId: string): Promise<void> {
    await pool.query(
      `UPDATE users
        SET last_login = NOW()
        WHERE id = $1`,
      [userId]
    );
  },

  async getUserByUsername(username: string): Promise<User> {
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
      `SELECT * 
        FROM users
        WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (result.rowCount !== 1) {
      throw new DBError.EmailDoesNotExist()
    }
    console.log(result.rows[0])
    return UserSchema.parse(result.rows[0]);
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

    if (result.rowCount !== 1) {
      throw new Error()
    }

    const user = UserSchema.parse(result.rows[0]);
    return user;
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

  async setEmailVerifiedById(id: string): Promise<void> {
    await pool.query(
      `UPDATE users
        SET email_verified = TRUE
        WHERE id = $1`,
      [id]
    );
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
    // TODO block access (move to admin ops)
    await pool.query(
      `DELETE FROM users
        WHERE id = $1`,
      [id]
    );
    // There is no delete query
  },

  async getIDByEmail(email: string): Promise<UUID | null> {
    const result = await pool.query(
      `SELECT id
        FROM users
        WHERE email = $1`,
      [email.toLowerCase()]
    );
    return (result.rows[0]?.id as UUID) ?? null;
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


  async getUserEloByID(userId: string, mode: number): Promise<number> {
    const result = await pool.query(
      `SELECT elo
        FROM elo
        WHERE player = $1 AND mode = $2`,
      [userId, mode]
    );

    if (result.rowCount !== 1) {
      throw new DBError.EloNotFound();
    }

    return result.rows[0].elo;
  },


  async initEloForUser(userId: string, mode: number, elo: number): Promise<void> {
    await pool.query(
      `INSERT INTO elo (player, mode, elo)
        VALUES ($1, $2, $3)`,
      [userId, mode, elo]
    );
  },









}