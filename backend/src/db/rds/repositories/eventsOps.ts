// import { Pool, PoolClient } from 'pg';
// import dotenv from 'dotenv';
// import * as DBError from '../dbErrors';
// import { ICHacker, leaderboardPlayer } from '@shared/Models/eventInfo';


// // Load .env from project root (prob should find a better way for this)
// dotenv.config({ path: "../../.env" });
// const application_name = "con-four";

// export class EventOperations {
//   private client: PoolClient | null = null;

//   private async getClient(): Promise<PoolClient> {
//     const pool = new Pool({
//       connectionString: process.env.DB_URL,
//       application_name: application_name
//     });

//     if (!this.client) {
//       this.client = await pool.connect();
//     }

//     return this.client;
//   }

//   private async safeRelease(): Promise<void> {
//     if (this.client) {
//       try {
//         this.client.release(); // Attempt to release the client
//       } catch (error) {
//         //console.error('Error releasing client:', error); // Log any errors during release
//       } finally {
//         this.client = null; // Ensure client is set to null after release
//       }
//     }
//   }

//     async getLeaderboard(gamemodeId: string, event: string): Promise<leaderboardPlayer[]> {
//         const client = await this.getClient();
//         try {
//             const results = await client.query(`SELECT elo, con4_schema.Users.username AS username FROM con4_schema.Elo
//                 INNER JOIN con4_schema.Users ON con4_schema.Elo.player = con4_schema.Users.id
//                 WHERE mode = $1
//                 ORDER BY elo DESC
//                 LIMIT 10;`, [gamemodeId]);
//             if (results.rows.length === 0)
//                 return [];
//             return results.rows.map((row: any, index: number) => {
//                 return {
//                     rank: index + 1,
//                     username: row.username,
//                     elo: row.elo
//                     } as leaderboardPlayer
//                 });
//         } catch (error) {
//             //console.error('Error in getLeaderboard:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }      
//     }

//     async registerForEvent(userId: string, event: string): Promise<void> {
//         const client = await this.getClient();
//         try {
//             await client.query(`INSERT INTO con4_schema.eventparticipants (user_id, event_id)
//             VALUES ($1, $2)
//             ON CONFLICT DO NOTHING`, [userId, event]);
//         } catch (error) {
//             //console.error('Error in registerForEvent:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }
//     }

//     async isMemberOfEvent(userId: string, event: string): Promise<boolean> {
//         const client = await this.getClient();
//         try {
//             const results = await client.query(
//                 `SELECT * FROM con4_schema.eventparticipants
//                     WHERE user_id = $1 AND event_id = $2;`, [userId, event]);
//             return results.rows.length > 0;
//         } catch (error) {
//             //console.error('Error in isMemberOfEvent:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }
//     }

//     async exitEvent(userId: string, event: string): Promise<void> {
//         const client = await this.getClient();
//         try {
//             await client.query(`DELETE FROM con4_schema.eventparticipants
//             WHERE user_id = $1 AND event_id = $2;`, [userId, event]);
//         } catch (error) {
//             //console.error('Error in exitEvent:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }
//     }


    


//     ////////////////////////////////////////////


//     async registerToICHACK25(hacker: ICHacker, discId: string): Promise<void> {
//         const client = await this.getClient();
//         try {
//             await client.query(`INSERT INTO events_schema.ichack25 (id, user_id, discord_id, full_name, hackspace)
//             VALUES ($1, $2, $3, $4, $5)
//             ON CONFLICT (id) DO UPDATE SET user_id = $2, discord_id = $3, full_name = $4, hackspace = $5;`, [hacker.id, hacker.user_id, discId, hacker.name, hacker.hackspace]);
//         } catch (error) {
//             //console.error('Error in registerToICHACK25:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }
//     }

//     async getAllICHackers(): Promise<ICHacker[]> {
//         const client = await this.getClient();
//         try {
//             const results = await client.query(`SELECT * FROM events_schema.ichack25;`);
//             return results.rows.map((row: any) => {
//                 return {
//                     id: row.id,
//                     user_id: row.user_id,
//                     name: row.full_name,
//                     hackspace: row.hackspace
//                 } as ICHacker });
//         } catch (error) {
//             //console.error('Error in getICHACK25Users:', error);
//             throw error;
//         } finally {
//             this.safeRelease();
//         }
//     }
// }
