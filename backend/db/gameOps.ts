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

  // Look for game
    // Add entry to GameLookup
  async BeginFindingGame(playerid: string, timecontid: string): Promise<void> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO con4_schema.GameLookup (player, time_control)
         VALUES ($1, $2)`,
        [playerid, timecontid]
      );

      return;
    } catch (error) {
      console.error('Failed to fetch id by email:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

    // Create game from both players
      // Insert into game
      // Update both player entries in game lookup
  async CreateGame(shortCode: string, p1id: string, p2id: string, game_info: string, eW: number, eL: number): Promise<void> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO con4_schema.Games (player, time_control)
          SELECT $1, $2, $3, $4, $5, $6, id FROM con4_schema.GameStates WHERE state = 'ongoing'`,
        [shortCode, p1id, p2id, game_info, eW, eL]
      );

      return;
    } catch (error) {
      console.error('Failed to fetch id by email:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }
  

    // Get a game by ID

    // Get moves by game ID
    
    // Get ongoing games by player

    // End ongoing game
      // Update game status 
      // Remove entry for both players in GameLookup
    

/////////////////////// Below are functions that are not called during live games but for analysing games


    // Get games by player

    /*async getUserByUsername(username: string): Promise<Boolean> {
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
    }*/
}
  
