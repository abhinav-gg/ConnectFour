import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';
import { Game, Move } from '@/models/Game';
import { GameMode, TimeControl } from '@shared/Models/gameInfo';

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
  async BeginFindingGame(playerid: string, game_info: string): Promise<void> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO con4_schema.GameLookup (player, game_info)
         VALUES ($1, $2)`,
        [playerid, game_info]
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
        this.client = null;
      }
    }

    // Create game from both players
      // Insert into game
      // Update both player entries in game lookup
  async CreateGame(shortCode: string, game_info: string): Promise<Game> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO con4_schema.Games (short_id, game_info, state)
          VALUES ($1, $2, 'scheduled')
          RETURNING short_id`,
        [shortCode, game_info]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to make the game:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }
  
  // Get a game by ID
  async GetGameByID(gameid: string): Promise<Game> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT * FROM con4_schema.Games WHERE id = $1`,
        [gameid]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Failed to fetch game by id:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // Get moves by game ID
  async GetMovesByGameID(gameid: string): Promise<Move[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT game_id, move, player, col, CAST(played_at AS FLOAT), delta FROM con4_schema.Moves 
          WHERE game_id = $1
          ORDER BY move`,
        [gameid]
      );
      return result.rows as Move[];
    } catch (error) {
      console.error('Failed to fetch moves by game id:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }
  
  // Get ongoing games by player
  async GetGameLookupByPlayer(playerid: string): Promise<string | null> {
    const client =  this.client ?? await this.getClient();
    try {
      const result = await client.query(
        `SELECT game FROM con4_schema.GameLookup 
          WHERE player = $1`,
        [playerid]
      );
      if (result.rowCount ?? 0 > 1 ) {
        throw new DBError.MultipleGamesFoundError();
      }
      return result.rows[0]?.game_id ?? null;
    } catch (error) {
      console.error('Failed to fetch ongoing games by player:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // Make Move
  async MakeMove(gameid: string, playerid: string, move: number, column: number, delta: number): Promise<Move[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO con4_schema.Moves (game_id, player, move, col, delta)
          VALUES ($1, $2, $3, $4, $5)`,
        [gameid, playerid, move, column, delta]
      );
      return result.rows as Move[];
    } catch (error) {
      console.error('Failed to make move:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // Get Exact Time Control
  async GetExactTimeControl(timeControl: TimeControl): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id FROM con4_schema.TimeControls
          WHERE base_time = $1 AND increment = $2 AND disadvantage = $3`,
        [timeControl.base_time, timeControl.increment, timeControl.disadvantage]
      );
      return result.rows[0]?.id;
    } catch (error) {
      console.error('Failed to fetch time control:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async GetGameModeID(gamemode: GameMode): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id FROM con4_schema.GameModes
          WHERE name = $1 AND event = $2`,
        [gamemode.name, gamemode.event]
      );
      return result.rows[0]?.id;
    } catch (error) {
      console.error('Failed to fetch game mode id:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // Get Game By Short Code
  async GetGameByShortCode(shortCode: string): Promise<Game> {
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
      this.client = null;
    }
  }

  async GetGameInfoID(gamemode: string, time_control: string) {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT id FROM con4_schema.GameInfo
          WHERE gamemode = $1 AND time_control = $2`,
        [gamemode, time_control]
      );
      if (result.rowCount === 0) {
        // Insert here
      }
      else {
        return result.rows[0]?.id;
      }
    } catch (error) {
      console.error('Failed to fetch game info id:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // Get Time Since Last Game
  async GetTimeSinceLastGame(playerid: string): Promise<number> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT (CAST((now()-created_at) AS FLOAT)) AS diff FROM con4_schema.GamePlayers
          WHERE player = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [playerid]
      );
      return result.rows[0]?.diff ;
    } catch (error) {
      console.error('Failed to fetch time since last game:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  // 
  async GetTimeControlFromShortCode(shortCode: string): Promise<TimeControl> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT base_time, increment, disadvantage FROM con4_schema.TimeControls
          INNER JOIN con4_schema.GameInfo ON con4_schema.GameInfo.time_control = con4_schema.TimeControls.id
          INNER JOIN con4_schema.Games ON con4_schema.Games.game_info = con4_schema.GameInfo.id
          WHERE con4_schema.Games.id = $1`,
        [shortCode]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Failed to fetch game info:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async GetGameModeFromShortCode(shortCode: string): Promise<GameMode> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT name, event FROM con4_schema.GameModes
          INNER JOIN con4_schema.GameInfo ON con4_schema.GameInfo.gamemode = con4_schema.GameModes.id
          INNER JOIN con4_schema.Games ON con4_schema.Games.game_info = con4_schema.GameInfo.id
          WHERE con4_schema.Games.short_id = $1`,
        [shortCode]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Failed to fetch game mode:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async GetGameStatusById(shortcode: string): Promise<string> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT state FROM con4_schema.Games WHERE short_id = $1`,
        [shortcode]
      );
      return result.rows[0]?.state;
    } catch (error) {
      console.error('Failed to fetch game status:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async AssignGame(gameid: string, playerid: string, playerNum: number, deltaElo: number): Promise<void> {
    const client = await this.getClient();
    try {
      const _res = await client.query(
        `UPDATE con4_schema.GameLookup
          SET game = $1
          WHERE player = $2`,
        [gameid, playerid]
      );
      const res = await client.query(`
        INSERT INTO con4_schema.GamePlayers (game_id, player, player_number, elo_change)`); // now insert into gameplayers
      return;
    } catch (error) {
      console.error('Failed to assign game:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

  async UnassignGame(game_id: string, playerid: string): Promise<void> {
    const client = await this.getClient();
    try {
      const _res = await client.query(
        `UPDATE con4_schema.GameLookup
          SET game = NULL
          WHERE player = $1`,
        [playerid]
      );
      const res = await client.query(
        `DELETE FROM con4_schema.GamePlayers
          WHERE player = $1
          AND game_id = $2`,
        [playerid, game_id]
      );
      return;
    } catch (error) {
      console.error('Failed to unassign game:', error);
      throw error;
    } finally {
      client.release();
      this.client = null;
    }
  }

    // End ongoing game
      // Update game status <- difficult
      // Remove entry for both players in GameLookup <- function defined above

/////////////////////// Below are functions that are not called during live games but for analysing games


    // Get games by player


}

// DELETE FROM con4_schema.users WHERE is_anonymous = true;
