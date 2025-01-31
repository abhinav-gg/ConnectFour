import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';


// Load .env from project root (prob should find a better way for this)
dotenv.config({ path: "../../.env" });
const application_name = "con-four";

export class EventOperations {
  private client: PoolClient | null = null;

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

  private async safeRelease(): Promise<void> {
    if (this.client) {
      try {
        this.client.release(); // Attempt to release the client
      } catch (error) {
        console.error('Error releasing client:', error); // Log any errors during release
      } finally {
        this.client = null; // Ensure client is set to null after release
      }
    }
  }

    async getLeaderboard(gamemodeId: string, event: string): Promise<any> {
        const client = await this.getClient();
        try {
        const results = await client.query(`SELECT * FROM con4_schema.Elo
            WHERE gamemode_id = $1
            ORDER BY elo DESC
            LIMIT 10;`, [gamemodeId]);
            return results.rows;
        } catch (error) {
            console.error('Error in getLeaderboard:', error);
            throw error;
        } finally {
            this.safeRelease();
        }      
    }

    async registerForEvent(userId: string, event: string): Promise<void> {
        const client = await this.getClient();
        try {
            await client.query(`INSERT INTO con4_schema.eventparticipants (user_id, event_id)
            VALUES ($1, $2);`, [userId, event]);
        } catch (error) {
            console.error('Error in registerForEvent:', error);
            throw error;
        } finally {
            this.safeRelease();
        }
    }

    async isMemberOfEvent(userId: string, event: string): Promise<boolean> {
        const client = await this.getClient();
        try {
            const results = await client.query(
                `SELECT * FROM con4_schema.eventparticipants
                    WHERE user_id = $1 AND event_id = $2;`, [userId, event]);
            return results.rows.length > 0;
        } catch (error) {
            console.error('Error in isMemberOfEvent:', error);
            throw error;
        } finally {
            this.safeRelease();
        }
    }

    async exitEvent(userId: string, event: string): Promise<void> {
        const client = await this.getClient();
        try {
            await client.query(`DELETE FROM con4_schema.eventparticipants
            WHERE user_id = $1 AND event_id = $2;`, [userId, event]);
        } catch (error) {
            console.error('Error in exitEvent:', error);
            throw error;
        } finally {
            this.safeRelease();
        }
    }


    


    ////////////////////////////////////////////


    async registerToICHACK25(userId: string): Promise<void> {
        const client = await this.getClient();
        try {
            await client.query(`INSERT INTO con4_schema.ichack25participants (user_id)
            VALUES ($1);`, [userId]);
        } catch (error) {
            console.error('Error in registerToICHACK25:', error);
            throw error;
        } finally {
            this.safeRelease();
        }
    }
}
