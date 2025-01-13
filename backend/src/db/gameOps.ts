import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';
import { User } from '@/models/User';
import { Games, Moves } from '@/models/Game';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";


export class GameOperations {
  // No need for a client property here
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
    }
  }

  // Finished Game Part One
    // Remove entry from GameLookup
    async FinishedGameLookup(playerid: string): Promise<void> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `DELETE FROM con4_schema.GameLookup
           WHERE player = $1`,
          [playerid]
        );
  
        return;
      } catch (error) {
        console.error('Could not delete user from game search:', error);
        throw error;
      } finally {
        client.release();
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
    }
  }
  
    // Get a game by ID
    async GetGameByID(gameid: string): Promise<void> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT * FROM con4_schema.Games WHERE id = $1`,
          [gameid]
        );
        return;
      } catch (error) {
        console.error('Failed to fetch game by id:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // Get moves by game ID
    async GetMovesByGameID(gameid: string): Promise<void> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT * FROM con4_schema.Moves 
            WHERE game_id = $1
            ORDER BY move`,
          [gameid]
        );
        return;
      } catch (error) {
        console.error('Failed to fetch moves by game id:', error);
        throw error;
      } finally {
        client.release();
      }
    }
    
    // Get ongoing games by player
    async GetOngoingGameByPlayer(playerid: string): Promise<string | null> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT game_id FROM con4_schema.GameLookup 
            WHERE player = $1`,
          [playerid]
        );
        return result.rows[0]?.game_id ?? null;
      } catch (error) {
        console.error('Failed to fetch ongoing games by player:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // Make Move
    async MakeMove(gameid: string, playerid: string, move: number, column: number, delta: number): Promise<[Moves]> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `INSERT INTO con4_schema.Moves (game_id, player, move, col, delta)
            VALUES ($1, $2, $3, $4, $5)`,
          [gameid, playerid, move, column, delta]
        );
        return result.rows as [Moves];
      } catch (error) {
        console.error('Failed to make move:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // Get Exact Time Control
    async GetExactTimeControl(base: number, incr: number, detr: number): Promise<void> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT id FROM con4_schema.TimeControls
            WHERE base_time = $1 AND increment = $2 AND disadvantage = $3`,
          [base, incr, detr]
        );
        return result.rows[0]?.id;
      } catch (error) {
        console.error('Failed to fetch time control:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // Get Game By Short Code
    async GetGameByShortCode(shortCode: string): Promise<Games> {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT * FROM con4_schema.Games WHERE short_id = $1`,
          [shortCode]
        );
        return result.rows[0];
      } catch (error) {
        console.error('Failed to fetch game by short code:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // End ongoing game
      // Update game status <- difficult
      // Remove entry for both players in GameLookup <- function defined above
    

/////////////////////// Below are functions that are not called during live games but for analysing games


    // Get games by player


}

// SELECT id FROM con4_schema.gamestates WHERE state = 'ongoing';
